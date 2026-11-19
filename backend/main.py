import os
import sys
import json
import shutil
import uuid
import asyncio
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional

# Add paths to sys.path so it works when run from any directory
_curr_dir = str(Path(__file__).resolve().parent)
_root_dir = str(Path(__file__).resolve().parent.parent)
for _p in [_curr_dir, _root_dir]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from core.ffmpeg_utils import get_video_info, extract_frame_at, generate_filmstrip
from core.ocr_engine import extract_subtitles_from_video
from core.gemini_asr import transcribe_with_gemini_sync
from core.translation_engine import translate_subtitles_batch, PROMPT_STYLES
from core.tts_engine import AVAILABLE_VOICES, generate_all_subtitles_tts, generate_single_tts
from core.render_engine import render_project_video
from core.smart_aligner import (
    smart_decollide_and_align_subtitles,
    detect_speech_intervals,
    find_uncovered_speech_gaps,
    recover_missing_dialogue_with_ai
)

app = FastAPI(title="VietAnh Sub Studio - Video Translation & Dubbing AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
EXPORTS_DIR = BASE_DIR / "exports"
TEMP_DIR = BASE_DIR / "temp"
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/exports", StaticFiles(directory=str(EXPORTS_DIR)), name="exports")
app.mount("/temp", StaticFiles(directory=str(TEMP_DIR)), name="temp")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

PROJECT_STATE = {
    "videos": [],
    "active_video_id": None,
    "batch_mode": False,
    "template_video_id": None
}

STATE_FILE = TEMP_DIR / "project_state.json"

def save_project_state():
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(PROJECT_STATE, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving project state: {e}")

def load_project_state():
    global PROJECT_STATE
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                valid_videos = []
                for v in loaded.get("videos", []):
                    if os.path.exists(v.get("path", "")):
                        valid_videos.append(v)
                if valid_videos:
                    PROJECT_STATE["videos"] = valid_videos
                    PROJECT_STATE["active_video_id"] = loaded.get("active_video_id") or valid_videos[0]["id"]
                    PROJECT_STATE["batch_mode"] = loaded.get("batch_mode", False)
                    return
        except Exception as e:
            print(f"Error loading project state: {e}")
            
    # Auto-discover videos from uploads if none loaded
    for vid_file in sorted(UPLOADS_DIR.glob("*.mp4"), key=os.path.getmtime, reverse=True):
        f_name = vid_file.name
        f_id = f_name.split("_")[0] if "_" in f_name else f_name[:8]
        if not any(v["id"] == f_id for v in PROJECT_STATE["videos"]):
            try:
                info = get_video_info(str(vid_file))
                item = {
                    "id": f_id,
                    "title": f_name[len(f_id)+1:] if "_" in f_name else f_name,
                    "path": str(vid_file),
                    "url": f"/uploads/{f_name}",
                    "duration": info["duration"],
                    "width": info["width"],
                    "height": info["height"],
                    "fps": info["fps"],
                    "subtitles": [],
                    "crop_box": {"x_pct": 0.05, "y_pct": 0.75, "w_pct": 0.90, "h_pct": 0.20},
                    "blur_box": {
                        "enabled": True, "type": "blur",
                        "x": int(info["width"] * 0.1), "y": int(info["height"] * 0.77),
                        "w": int(info["width"] * 0.8), "h": int(info["height"] * 0.15),
                        "sync_subtitles": True
                    },
                    "status": "ready",
                    "filmstrip": generate_filmstrip(str(vid_file), str(TEMP_DIR), count=12)
                }
                PROJECT_STATE["videos"].append(item)
            except Exception:
                pass
    if PROJECT_STATE["videos"] and not PROJECT_STATE["active_video_id"]:
        PROJECT_STATE["active_video_id"] = PROJECT_STATE["videos"][0]["id"]

load_project_state()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/config")
def get_config():
    return {
        "voices": AVAILABLE_VOICES,
        "prompt_styles": [{"id": k, "label": k.replace("_", " ").title(), "prompt": v} for k, v in PROMPT_STYLES.items()]
    }

class CheckKeyRequest(BaseModel):
    api_key: str

@app.post("/api/check-api-key")
async def check_api_key(req: CheckKeyRequest):
    key = req.api_key.strip()
    if not key:
        return JSONResponse(status_code=400, content={"valid": False, "error": "API Key đang trống."})
        
    import httpx
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                models = [m["name"].replace("models/", "") for m in data.get("models", []) if "generateContent" in m.get("supportedGenerationMethods", [])]
                return {
                    "valid": True,
                    "models": models,
                    "message": f"Khóa API hợp lệ! Tìm thấy {len(models)} mô hình khả dụng."
                }
            else:
                err = resp.json()
                msg = err.get("error", {}).get("message", resp.text)
                return JSONResponse(status_code=400, content={"valid": False, "error": msg})
    except Exception as e:
        return JSONResponse(status_code=500, content={"valid": False, "error": str(e)})

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())[:8]
    ext = Path(file.filename).suffix or ".mp4"
    save_filename = f"{file_id}_{file.filename}"
    save_path = UPLOADS_DIR / save_filename
    
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    info = get_video_info(str(save_path))
    thumb_filename = f"thumb_{file_id}.jpg"
    thumb_path = TEMP_DIR / thumb_filename
    extract_frame_at(str(save_path), min(1.0, info["duration"] / 2.0), str(thumb_path))
    
    video_item = {
        "id": file_id,
        "title": file.filename,
        "filename": save_filename,
        "path": str(save_path),
        "url": f"/uploads/{save_filename}",
        "thumbnail": f"/temp/{thumb_filename}",
        "duration": info["duration"],
        "width": info["width"],
        "height": info["height"],
        "fps": info["fps"],
        "subtitles": [],
        "crop_box": {
            "x_pct": 0.05,
            "y_pct": 0.75,
            "w_pct": 0.90,
            "h_pct": 0.20
        },
        "blur_box": {
            "enabled": True,
            "type": "blur",
            "x": int(info["width"] * 0.1),
            "y": int(info["height"] * 0.77),
            "w": int(info["width"] * 0.8),
            "h": int(info["height"] * 0.15),
            "sync_subtitles": True
        },
        "status": "ready",
        "filmstrip": generate_filmstrip(str(save_path), str(TEMP_DIR), count=12)
    }
    
    PROJECT_STATE["videos"].append(video_item)
    if PROJECT_STATE["active_video_id"] is None:
        PROJECT_STATE["active_video_id"] = file_id
    save_project_state()
    return video_item

@app.get("/api/videos")
def get_videos():
    for v in PROJECT_STATE["videos"]:
        if not v.get("filmstrip") and os.path.exists(v.get("path", "")):
            try:
                v["filmstrip"] = generate_filmstrip(v["path"], str(TEMP_DIR), count=12)
            except Exception:
                v["filmstrip"] = []
        for s in v.get("subtitles", []):
            if s.get("audio_file") and not s.get("audio_url"):
                norm = s["audio_file"].replace("\\", "/")
                if "/temp/" in norm:
                    s["audio_url"] = norm[norm.index("/temp/"):]
    return PROJECT_STATE

class AutoPipelineRequest(BaseModel):
    video_id: str
    api_key: str = ""
    target_language: str = "Vietnamese"
    style_key: str = "default"
    character_profiles: str = ""
    voice_id: str = "vi-VN-HoaiMyNeural"
    auto_fit: bool = True

@app.post("/api/pipeline/auto")
async def run_auto_pipeline(req: AutoPipelineRequest):
    video = next((v for v in PROJECT_STATE["videos"] if v["id"] == req.video_id), None)
    if not video:
        return JSONResponse(status_code=404, content={"error": "Video not found"})

    main_loop = asyncio.get_running_loop()

    async def process():
        try:
            # 1. ASR & Transcription
            def on_asr_prog(p, msg):
                asyncio.run_coroutine_threadsafe(
                    manager.broadcast({
                        "type": "pipeline_progress",
                        "video_id": req.video_id,
                        "step": "asr",
                        "progress": p * 0.4,
                        "message": f"Bước 1/3 - {msg}"
                    }), main_loop
                )

            subs = await asyncio.to_thread(
                transcribe_with_gemini_sync,
                video["path"],
                api_key=req.api_key,
                target_language=req.target_language,
                character_profiles=req.character_profiles,
                progress_callback=on_asr_prog
            )
            video["subtitles"] = subs

            # 2. Translation check (if needed, otherwise gemini_asr already translated)
            needs_trans = any(not s.get("translated_text") for s in subs)
            if needs_trans:
                def on_trans_prog(p, msg):
                    asyncio.run_coroutine_threadsafe(
                        manager.broadcast({
                            "type": "pipeline_progress",
                            "video_id": req.video_id,
                            "step": "translate",
                            "progress": 0.4 + (p * 0.25),
                            "message": f"Bước 2/3 - {msg}"
                        }), main_loop
                    )
                subs = await translate_subtitles_batch(
                    subs,
                    provider="gemini",
                    api_key=req.api_key,
                    target_language=req.target_language,
                    character_profiles=req.character_profiles,
                    style_key=req.style_key,
                    progress_callback=on_trans_prog
                )
                video["subtitles"] = subs

            # 3. TTS Dubbing
            def on_tts_prog(p, msg):
                asyncio.run_coroutine_threadsafe(
                    manager.broadcast({
                        "type": "pipeline_progress",
                        "video_id": req.video_id,
                        "step": "tts",
                        "progress": 0.65 + (p * 0.35),
                        "message": f"Bước 3/3 - {msg}"
                    }), main_loop
                )

            tts_dir = str(TEMP_DIR / f"tts_{req.video_id}")
            subs_with_audio = await generate_all_subtitles_tts(
                video["subtitles"],
                voice_id=req.voice_id,
                output_dir=tts_dir,
                auto_fit=req.auto_fit,
                progress_callback=on_tts_prog
            )
            for s in subs_with_audio:
                if s.get("audio_file"):
                    norm = s["audio_file"].replace("\\", "/")
                    if "/temp/" in norm:
                        s["audio_url"] = norm[norm.index("/temp/"):]
            video["subtitles"] = subs_with_audio
            video["status"] = "ready_for_export"
            save_project_state()

            await manager.broadcast({
                "type": "pipeline_complete",
                "video_id": req.video_id,
                "subtitles": subs_with_audio
            })
        except Exception as e:
            print(f"Error in auto pipeline: {e}")
            await manager.broadcast({
                "type": "pipeline_error",
                "video_id": req.video_id,
                "error": str(e)
            })

    asyncio.create_task(process())
    return {"message": "Auto pipeline started"}

class OcrRequest(BaseModel):
    video_id: str
    model: str = "pp-ocrv4"
    api_key: str = ""
    crop_box: Optional[Dict[str, Any]] = None
    fps_sample: float = 1.8

@app.post("/api/ocr")
async def run_ocr(req: OcrRequest):
    video = next((v for v in PROJECT_STATE["videos"] if v["id"] == req.video_id), None)
    if not video:
        return JSONResponse(status_code=404, content={"error": "Video not found"})
        
    crop = req.crop_box or video.get("crop_box")
    video["crop_box"] = crop

    main_loop = asyncio.get_running_loop()

    async def process():
        try:
            if "gemini" in req.model.lower():
                def on_prog(p, msg):
                    asyncio.run_coroutine_threadsafe(
                        manager.broadcast({
                            "type": "ocr_progress",
                            "video_id": req.video_id,
                            "progress": p,
                            "message": msg
                        }), main_loop
                    )
                subs = await asyncio.to_thread(
                    transcribe_with_gemini_sync,
                    video["path"],
                    api_key=req.api_key,
                    target_language="Vietnamese",
                    model_name="gemini-2.0-flash",
                    progress_callback=on_prog
                )
            else:
                def on_prog(p, msg):
                    asyncio.run_coroutine_threadsafe(
                        manager.broadcast({
                            "type": "ocr_progress",
                            "video_id": req.video_id,
                            "progress": p,
                            "message": msg
                        }), main_loop
                    )
                subs = await asyncio.to_thread(
                    extract_subtitles_from_video,
                    video["path"],
                    crop,
                    req.fps_sample,
                    on_prog
                )
            
            video["subtitles"] = subs
            video["status"] = "ocr_done"
            save_project_state()
            await asyncio.sleep(0.1)
            await manager.broadcast({
                "type": "ocr_complete",
                "video_id": req.video_id,
                "subtitles": subs
            })
        except Exception as e:
            print(f"Error in OCR/ASR: {e}")
            import traceback
            traceback.print_exc()
            asyncio.run_coroutine_threadsafe(
                manager.broadcast({
                    "type": "ocr_error",
                    "video_id": req.video_id,
                    "error": str(e)
                }), main_loop
            )

    asyncio.create_task(process())
    return {"message": "OCR started"}

class TranslateRequest(BaseModel):
    video_id: str
    provider: str = "gemini"
    api_key: str = ""
    model: str = "gemini-2.5-flash"
    base_url: str = ""
    style_key: str = "default"
    custom_system_prompt: str = ""
    character_profiles: str = ""
    target_language: str = "Vietnamese"

@app.post("/api/translate")
async def run_translation(req: TranslateRequest):
    video = next((v for v in PROJECT_STATE["videos"] if v["id"] == req.video_id), None)
    if not video or not video.get("subtitles"):
        return JSONResponse(status_code=400, content={"error": "No subtitles found to translate"})

    main_loop = asyncio.get_running_loop()

    async def process():
        try:
            def on_prog(p, msg):
                asyncio.run_coroutine_threadsafe(
                    manager.broadcast({
                        "type": "translate_progress",
                        "video_id": req.video_id,
                        "progress": p,
                        "message": msg
                    }), main_loop
                )
                
            translated = await translate_subtitles_batch(
                video["subtitles"],
                provider=req.provider,
                api_key=req.api_key,
                model=req.model,
                base_url=req.base_url,
                style_key=req.style_key,
                custom_system_prompt=req.custom_system_prompt,
                character_profiles=req.character_profiles,
                target_language=req.target_language,
                progress_callback=on_prog
            )
            video["subtitles"] = translated
            video["status"] = "translated"
            save_project_state()
            await manager.broadcast({
                "type": "translate_complete",
                "video_id": req.video_id,
                "subtitles": translated
            })
        except Exception as e:
            print(f"Error in translation: {e}")
            await manager.broadcast({
                "type": "translate_progress",
                "video_id": req.video_id,
                "progress": 0,
                "message": f"Lỗi dịch thuật: {str(e)}"
            })

    asyncio.create_task(process())
    return {"message": "Translation started"}

class TtsRequest(BaseModel):
    video_id: str
    voice_id: str = "vi-VN-HoaiMyNeural"
    pronunciation_rules: Optional[List[Dict[str, str]]] = None
    auto_fit: bool = True
    subtitles: Optional[List[Dict[str, Any]]] = None

@app.post("/api/tts")
async def run_tts(req: TtsRequest):
    video = next((v for v in PROJECT_STATE["videos"] if v["id"] == req.video_id), None)
    if not video:
        return JSONResponse(status_code=404, content={"error": "Video not found"})
        
    if req.subtitles:
        video["subtitles"] = req.subtitles

    if not video.get("subtitles"):
        return JSONResponse(status_code=400, content={"error": "No subtitles found"})

    main_loop = asyncio.get_running_loop()

    async def process():
        try:
            def on_prog(p, msg):
                if p < 1.0:
                    asyncio.run_coroutine_threadsafe(
                        manager.broadcast({
                            "type": "tts_progress",
                            "video_id": req.video_id,
                            "progress": p,
                            "message": msg
                        }), main_loop
                    )
                
            tts_dir = str(TEMP_DIR / f"tts_{req.video_id}")
            subs_with_audio = await generate_all_subtitles_tts(
                video["subtitles"],
                voice_id=req.voice_id,
                output_dir=tts_dir,
                pronunciation_rules=req.pronunciation_rules,
                auto_fit=req.auto_fit,
                progress_callback=on_prog
            )
            for s in subs_with_audio:
                if s.get("audio_file"):
                    norm = s["audio_file"].replace("\\", "/")
                    if "/temp/" in norm:
                        s["audio_url"] = norm[norm.index("/temp/"):]
            video["subtitles"] = subs_with_audio
            video["status"] = "tts_done"
            save_project_state()
            await asyncio.sleep(0.1)
            await manager.broadcast({
                "type": "tts_complete",
                "video_id": req.video_id,
                "subtitles": subs_with_audio
            })
        except Exception as e:
            print(f"Error in TTS: {e}")
            await manager.broadcast({
                "type": "tts_error",
                "video_id": req.video_id,
                "error": str(e)
            })

    asyncio.create_task(process())
    return {"message": "TTS generation started"}

class SingleTtsRequest(BaseModel):
    video_id: str
    sub_id: int
    text: str
    voice_id: str = "vi-VN-HoaiMyNeural"
    auto_fit: bool = True

@app.post("/api/tts/single")
async def generate_single_subtitle_tts(req: SingleTtsRequest):
    video = next((v for v in PROJECT_STATE["videos"] if v["id"] == req.video_id), None)
    if not video or not video.get("subtitles"):
        return JSONResponse(status_code=404, content={"error": "Video or subtitles not found"})
    
    sub = next((s for s in video["subtitles"] if s["id"] == req.sub_id), None)
    if not sub:
        return JSONResponse(status_code=404, content={"error": f"Subtitle #{req.sub_id} not found"})
    
    tts_dir = TEMP_DIR / f"tts_{req.video_id}"
    tts_dir.mkdir(parents=True, exist_ok=True)
    import time
    out_path = str(tts_dir / f"sub_{sub['id']}_{int(time.time())}.mp3")
    target_dur = sub["end"] - sub["start"]
    
    sub["translated_text"] = req.text.strip()
    success = await generate_single_tts(
        req.text,
        voice_id=req.voice_id,
        output_path=out_path,
        target_duration=target_dur,
        auto_fit=req.auto_fit
    )
    if success:
        sub["audio_file"] = out_path
        norm = out_path.replace("\\", "/")
        sub["audio_url"] = norm[norm.index("/temp/"):] if "/temp/" in norm else f"/temp/tts_{req.video_id}/{os.path.basename(out_path)}"
        sub["voice_id"] = req.voice_id
        info = get_video_info(out_path)
        act_dur = float(info.get("duration", 0.0))
        if act_dur > 0:
            sub["audio_duration"] = round(act_dur, 2)
            sub["end"] = round(sub["start"] + act_dur, 2)
        save_project_state()
        return {"success": True, "subtitle": sub, "subtitles": video["subtitles"]}
    else:
        return JSONResponse(status_code=500, content={"error": "Failed to generate TTS audio"})

class SaveSubtitlesRequest(BaseModel):
    video_id: str
    subtitles: List[Dict[str, Any]]

@app.post("/api/subtitles/save")
async def save_subtitles(req: SaveSubtitlesRequest):
    video = next((v for v in PROJECT_STATE["videos"] if v["id"] == req.video_id), None)
    if not video:
        return JSONResponse(status_code=404, content={"error": "Video not found"})
    video["subtitles"] = req.subtitles
    save_project_state()
    return {"success": True, "subtitles": video["subtitles"]}

class DeleteVoiceRequest(BaseModel):
    video_id: str
    sub_id: int

@app.post("/api/subtitles/delete-voice")
async def delete_single_voice(req: DeleteVoiceRequest):
    video = next((v for v in PROJECT_STATE["videos"] if v["id"] == req.video_id), None)
    if not video or not video.get("subtitles"):
        return JSONResponse(status_code=404, content={"error": "Video or subtitles not found"})
    sub = next((s for s in video["subtitles"] if s["id"] == req.sub_id), None)
    if not sub:
        return JSONResponse(status_code=404, content={"error": f"Subtitle #{req.sub_id} not found"})
    if sub.get("audio_file") and os.path.exists(sub["audio_file"]):
        try:
            os.remove(sub["audio_file"])
        except OSError:
            pass
    sub["audio_file"] = None
    sub["audio_url"] = None
    save_project_state()
    return {"success": True, "subtitle": sub, "subtitles": video["subtitles"]}

class DeleteSubRequest(BaseModel):
    video_id: str
    sub_id: int

@app.post("/api/subtitles/delete")
async def delete_subtitle_row(req: DeleteSubRequest):
    video = next((v for v in PROJECT_STATE["videos"] if v["id"] == req.video_id), None)
    if not video or not video.get("subtitles"):
        return JSONResponse(status_code=404, content={"error": "Video or subtitles not found"})
    video["subtitles"] = [s for s in video["subtitles"] if s["id"] != req.sub_id]
    for idx, s in enumerate(video["subtitles"]):
        s["id"] = idx + 1
    save_project_state()
    return {"success": True, "subtitles": video["subtitles"]}

class AddSubRequest(BaseModel):
    video_id: str
    start: float
    end: float
    text: str = ""
    translated_text: str = ""

@app.post("/api/subtitles/add")
async def add_subtitle_row(req: AddSubRequest):
    video = next((v for v in PROJECT_STATE["videos"] if v["id"] == req.video_id), None)
    if not video:
        return JSONResponse(status_code=404, content={"error": "Video not found"})
    if "subtitles" not in video:
        video["subtitles"] = []
    new_sub = {
        "id": len(video["subtitles"]) + 1,
        "start": round(max(0.0, req.start), 2),
        "end": round(max(req.start + 1.0, req.end), 2),
        "text": req.text.strip(),
        "translated_text": req.translated_text.strip() or req.text.strip(),
        "speaker": "Speaker",
        "audio_file": None,
        "audio_url": None
    }
    video["subtitles"].append(new_sub)
    video["subtitles"].sort(key=lambda s: s["start"])
    for idx, s in enumerate(video["subtitles"]):
        s["id"] = idx + 1
    save_project_state()
    return {"success": True, "subtitle": new_sub, "subtitles": video["subtitles"]}

class UpdateSubStyleRequest(BaseModel):
    video_id: str
    sub_style: Dict[str, Any]

@app.post("/api/video/sub-style")
async def update_sub_style_endpoint(req: UpdateSubStyleRequest):
    video = next((v for v in PROJECT_STATE["videos"] if v["id"] == req.video_id), None)
    if not video:
        return JSONResponse(status_code=404, content={"error": "Video not found"})
    video["sub_style"] = req.sub_style
    save_project_state()
    return {"success": True, "sub_style": video["sub_style"]}

class ExportRequest(BaseModel):
    video_id: str
    color_filter: str = "none"
    isolate_bgm: bool = True
    original_audio_vol: float = 0.8
    tts_audio_vol: float = 1.25
    burn_subtitles: bool = True
    sub_style: Optional[Dict[str, Any]] = None
    blur_box: Optional[Dict[str, Any]] = None
    custom_filename: Optional[str] = None
    custom_export_dir: Optional[str] = None
    subtitles: Optional[List[Dict[str, Any]]] = None

class AlignDecollideRequest(BaseModel):
    video_id: str
    min_gap: float = 0.30
    subtitles: Optional[List[Dict[str, Any]]] = None

@app.post("/api/ai/align-and-decollide")
async def align_and_decollide_endpoint(req: AlignDecollideRequest):
    video = next((v for v in PROJECT_STATE["videos"] if v["id"] == req.video_id), None)
    if not video:
        return JSONResponse(status_code=404, content={"error": "Video not found"})
        
    subs = req.subtitles if req.subtitles is not None else video.get("subtitles", [])
    if not subs:
        return JSONResponse(status_code=400, content={"error": "Chưa có câu phụ đề nào để căn chỉnh"})
        
    total_dur = float(video.get("duration", 9999.0))
    aligned = smart_decollide_and_align_subtitles(
        subs,
        total_video_duration=total_dur,
        min_breath_gap=req.min_gap
    )
    video["subtitles"] = aligned
    save_project_state()
    return {
        "success": True,
        "message": f"Đã tối ưu nhịp thở và căn chỉnh chống dính cho {len(aligned)} câu thoại thành công!",
        "subtitles": aligned
    }

class RecoverMissingRequest(BaseModel):
    video_id: str
    api_key: str = ""
    target_language: str = "Vietnamese"

@app.post("/api/ai/recover-missing")
async def recover_missing_endpoint(req: RecoverMissingRequest):
    video = next((v for v in PROJECT_STATE["videos"] if v["id"] == req.video_id), None)
    if not video:
        return JSONResponse(status_code=404, content={"error": "Video not found"})
        
    main_loop = asyncio.get_running_loop()
    
    async def process():
        try:
            def on_prog(p, msg):
                asyncio.run_coroutine_threadsafe(
                    manager.broadcast({
                        "type": "recover_progress",
                        "video_id": req.video_id,
                        "progress": p,
                        "message": msg
                    }), main_loop
                )

            on_prog(0.15, "Đang phân tích phổ âm thanh VAD để tìm các đoạn thoại bị bỏ sót...")
            speech_intervals = await asyncio.to_thread(detect_speech_intervals, video["path"])
            
            existing_subs = video.get("subtitles", [])
            uncovered_gaps = find_uncovered_speech_gaps(existing_subs, speech_intervals, min_gap_sec=1.5)
            
            if not uncovered_gaps:
                on_prog(1.0, "Tuyệt vời! Video của bạn đã được nhận diện đầy đủ, không còn phân đoạn thoại nào bị sót.")
                await manager.broadcast({
                    "type": "recover_complete",
                    "video_id": req.video_id,
                    "recovered_count": 0,
                    "subtitles": existing_subs
                })
                return

            on_prog(0.35, f"Tìm thấy {len(uncovered_gaps)} phân đoạn âm thanh chưa có phụ đề. Đang kích hoạt AI bóc băng bổ sung...")
            recovered = await recover_missing_dialogue_with_ai(
                video["path"],
                uncovered_gaps,
                api_key=req.api_key,
                target_language=req.target_language,
                progress_callback=on_prog
            )
            
            merged = list(existing_subs) + recovered
            total_dur = float(video.get("duration", 9999.0))
            final_aligned = smart_decollide_and_align_subtitles(merged, total_video_duration=total_dur, min_breath_gap=0.30)
            
            video["subtitles"] = final_aligned
            save_project_state()
            
            await manager.broadcast({
                "type": "recover_complete",
                "video_id": req.video_id,
                "recovered_count": len(recovered),
                "subtitles": final_aligned
            })
        except Exception as e:
            print(f"Error in recover_missing: {e}")
            await manager.broadcast({
                "type": "recover_error",
                "video_id": req.video_id,
                "error": str(e)
            })

    asyncio.create_task(process())
    return {"message": "Recovery started"}

class AgentChatRequest(BaseModel):
    video_id: str
    prompt: str
    api_key: str = ""

@app.post("/api/ai/agent-chat")
async def agent_chat_endpoint(req: AgentChatRequest):
    video = next((v for v in PROJECT_STATE["videos"] if v["id"] == req.video_id), None)
    if not video:
        return JSONResponse(status_code=404, content={"error": "Video not found"})
        
    p_lower = req.prompt.lower().strip()
    subs = video.get("subtitles", [])
    total_dur = float(video.get("duration", 9999.0))
    action_taken = None
    
    if any(k in p_lower for k in ["khớp", "dính", "căn chỉnh", "khoảng nghỉ", "chống dính", "align"]):
        aligned = smart_decollide_and_align_subtitles(subs, total_video_duration=total_dur, min_breath_gap=0.30)
        video["subtitles"] = aligned
        save_project_state()
        action_taken = "align"
        reply = f"🤖 AI Copilot: Đã tự động căn chỉnh và tạo nhịp nghỉ tự nhiên (0.3s) cho {len(aligned)} câu thoại. Các câu không còn bị đè lên nhau nữa!"
    elif any(k in p_lower for k in ["sót", "thiếu", "quét vét", "chưa nhận", "bổ sung"]):
        action_taken = "recover_trigger"
        reply = "🤖 AI Copilot: Đang kích hoạt phân tích phổ âm thanh VAD để tìm các phân đoạn thoại bị bỏ sót và bóc băng bổ sung..."
    elif any(k in p_lower for k in ["xóa hết", "clear", "làm lại"]):
        action_taken = "clear_subs"
        reply = "🤖 AI Copilot: Bạn có thể nhấn nút [Phụ đề] trong hàng HOÀN TÁC ở cột trái để làm mới toàn bộ danh sách phụ đề."
    else:
        reply = f"🤖 AI Copilot: Tôi đã nhận lệnh '{req.prompt}'. Dự án hiện có {len(subs)} câu thoại. Hãy bấm [⚡ AI Khớp câu thoại] hoặc [🔍 Quét vét phân đoạn thiếu] trên Timeline để xử lý ngay!"
        
    return {
        "reply": reply,
        "action": action_taken,
        "subtitles": video.get("subtitles", [])
    }

class OpenFolderRequest(BaseModel):
    folder_path: Optional[str] = None
    file_path: Optional[str] = None

@app.post("/api/open-folder")
async def open_folder(req: OpenFolderRequest):
    """Opens folder or selects file in Windows File Explorer."""
    try:
        target = req.file_path or req.folder_path or str(EXPORTS_DIR)
        target = os.path.abspath(target)
        if req.file_path and os.path.exists(req.file_path):
            subprocess.Popen(f'explorer /select,"{target}"', shell=True)
        else:
            if not os.path.exists(target):
                os.makedirs(target, exist_ok=True)
            subprocess.Popen(f'explorer "{target}"', shell=True)
        return {"success": True, "path": target}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/export-defaults")
async def get_export_defaults(video_id: str):
    video = next((v for v in PROJECT_STATE["videos"] if v["id"] == video_id), None)
    if not video:
        return JSONResponse(status_code=404, content={"error": "Video not found"})
    clean_title = Path(video["title"]).stem
    default_name = f"VietAnhSub_{clean_title}.mp4"
    return {
        "default_filename": default_name,
        "default_export_dir": str(EXPORTS_DIR.resolve())
    }

@app.post("/api/export")
async def export_video(req: ExportRequest):
    video = next((v for v in PROJECT_STATE["videos"] if v["id"] == req.video_id), None)
    if not video:
        return JSONResponse(status_code=404, content={"error": "Video not found"})
    if req.subtitles:
        video["subtitles"] = req.subtitles
    if not video.get("subtitles"):
        return JSONResponse(status_code=400, content={"error": "Video or subtitles missing"})

    export_dir = Path(req.custom_export_dir).resolve() if req.custom_export_dir else EXPORTS_DIR
    export_dir.mkdir(parents=True, exist_ok=True)

    clean_title = Path(video['title']).stem
    default_name = f"VietAnhSub_{clean_title}.mp4"
    raw_name = (req.custom_filename or default_name).strip()
    if not raw_name.lower().endswith(".mp4"):
        raw_name += ".mp4"
    out_filename = raw_name
    out_path = str(export_dir / out_filename)
    main_loop = asyncio.get_running_loop()

    async def process():
        try:
            def on_prog(p, msg):
                asyncio.run_coroutine_threadsafe(
                    manager.broadcast({
                        "type": "export_progress",
                        "video_id": req.video_id,
                        "progress": p,
                        "message": msg
                    }), main_loop
                )
                
            success = await asyncio.to_thread(
                render_project_video,
                video["path"],
                video["subtitles"],
                out_path,
                blur_box=req.blur_box or video.get("blur_box"),
                color_filter=req.color_filter,
                sub_style=req.sub_style,
                isolate_bgm=req.isolate_bgm,
                original_audio_vol=req.original_audio_vol,
                tts_audio_vol=req.tts_audio_vol,
                burn_subtitles=req.burn_subtitles,
                progress_callback=on_prog
            )
            
            if success:
                file_size_mb = round(os.path.getsize(out_path) / (1024 * 1024), 2) if os.path.exists(out_path) else 0
                await manager.broadcast({
                    "type": "export_complete",
                    "video_id": req.video_id,
                    "download_url": f"/exports/{out_filename}",
                    "filename": out_filename,
                    "file_path": out_path,
                    "folder_path": str(export_dir),
                    "file_size_mb": file_size_mb
                })
        except Exception as e:
            print(f"Error in Export: {e}")
            await manager.broadcast({
                "type": "export_progress",
                "video_id": req.video_id,
                "progress": 0,
                "message": f"Lỗi xuất video: {str(e)}"
            })

    asyncio.create_task(process())
    return {"message": "Export started", "output_path": out_path, "filename": out_filename}

if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
else:
    @app.get("/")
    def index():
        return {"message": "VietAnh Sub Studio Backend API is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
