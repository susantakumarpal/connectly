import json

from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import render


def react_app(request):
    manifest_path = settings.BASE_DIR / "static" / "app" / ".vite" / "manifest.json"
    if not manifest_path.exists():
        return HttpResponse(
            "React build is missing. Run `npm run build` from the frontend directory.",
            status=503,
            content_type="text/plain",
        )
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    entry = manifest["app.html"]
    return render(
        request,
        "react_app.html",
        {
            "script_path": f"app/{entry['file']}",
            "style_paths": [f"app/{path}" for path in entry.get("css", [])],
        },
    )