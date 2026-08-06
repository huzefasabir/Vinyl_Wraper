from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.storage.local import storage_service
from app.models.project import Project

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "ok", "storage": "local_disk"}

@router.post("/projects/upload")
async def upload_room_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    upload_result = await storage_service.save_file(file, subfolder="uploads")
    
    new_project = Project(
        raw_image_url=upload_result["url"],
        status="UPLOADED",
        metadata_json={"original_filename": file.filename}
(Vinyl_Wraper) F:\Vinyl_Wraper>
(Vinyl_Wraper) F:\Vinyl_Wraper>uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
INFO:     Will watch for changes in these directories: ['F:\\Vinyl_Wraper']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [10676] using WatchFiles
Process SpawnProcess-1:
Traceback (most recent call last):
  File "C:\Users\huzef\AppData\Roaming\uv\python\cpython-3.14.0-windows-x86_64-none\Lib\multiprocessing\process.py", line 320, in _bootstrap
    self.run()
    ~~~~~~~~^^
  File "C:\Users\huzef\AppData\Roaming\uv\python\cpython-3.14.0-windows-x86_64-none\Lib\multiprocessing\process.py", line 108, in run
    self._target(*self._args, **self._kwargs)
    ~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "F:\Vinyl_Wraper\.venv\Lib\site-packages\uvicorn\_subprocess.py", line 80, in subprocess_started
    target(sockets=sockets)
    ~~~~~~^^^^^^^^^^^^^^^^^
  File "F:\Vinyl_Wraper\.venv\Lib\site-packages\uvicorn\server.py", line 77, in run
    return asyncio_run(self.serve(sockets=sockets), loop_factory=self.config.get_loop_factory())
  File "C:\Users\huzef\AppData\Roaming\uv\python\cpython-3.14.0-windows-x86_64-none\Lib\asyncio\runners.py", line 204, in run
    return runner.run(main)
           ~~~~~~~~~~^^^^^^
  File "C:\Users\huzef\AppData\Roaming\uv\python\cpython-3.14.0-windows-x86_64-none\Lib\asyncio\runners.py", line127, in run
    return self._loop.run_until_complete(task)
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^
  File "C:\Users\huzef\AppData\Roaming\uv\python\cpython-3.14.0-windows-x86_64-none\Lib\asyncio\base_events.py", line 719, in run_until_complete
    return future.result()
           ~~~~~~~~~~~~~^^
  File "F:\Vinyl_Wraper\.venv\Lib\site-packages\uvicorn\server.py", line 81, in serve
    await self._serve(sockets)
  File "F:\Vinyl_Wraper\.venv\Lib\site-packages\uvicorn\server.py", line 88, in _serve
    config.load()
    ~~~~~~~~~~~^^
  File "F:\Vinyl_Wraper\.venv\Lib\site-packages\uvicorn\config.py", line 494, in load
    self.loaded_app = self.load_app()
                      ~~~~~~~~~~~~~^^
  File "F:\Vinyl_Wraper\.venv\Lib\site-packages\uvicorn\config.py", line 428, in load_app
    return import_from_string(self.app)
  File "F:\Vinyl_Wraper\.venv\Lib\site-packages\uvicorn\importer.py", line 22, in import_from_string
    raise exc from None
  File "F:\Vinyl_Wraper\.venv\Lib\site-packages\uvicorn\importer.py", line 19, in import_from_string
    module = importlib.import_module(module_str)
  File "C:\Users\huzef\AppData\Roaming\uv\python\cpython-3.14.0-windows-x86_64-none\Lib\importlib\__init__.py", line 88, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1398, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1371, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1314, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 491, in _call_with_frames_removed
  File "<frozen importlib._bootstrap>", line 1398, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1371, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1335, in _find_and_load_unlocked
ModuleNotFoundError: No module named 'app'

    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)

    return {
        "project_id": str(new_project.id),
        "status": new_project.status,
        "image_url": new_project.raw_image_url,
        "message": "File uploaded successfully to local storage."
    }