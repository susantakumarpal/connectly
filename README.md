# Connectly

Features: sign up / login / logout, profiles with bio + avatar, create posts (text + image),
likes, comments, follow / unfollow, home feed (you + people you follow), explore, search, admin panel.

Stack: Django, SQLite, React 19, Tailwind CSS 4, Vite, and Lucide.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate        # Windows PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # optional, for /admin/
cd frontend
npm install
npm run build
cd ..
python manage.py runserver
```

Open http://127.0.0.1:8000/ and create an account. Django serves the production React bundle from `static/app/`.

For frontend development, keep Django running on port 8000 and start Vite in a second terminal:

```bash
cd frontend
npm run dev
```

## API

The API uses Django session authentication and CSRF tokens. The React client gets a token from `/api/v1/auth/csrf/` and sends it on writes.

- `/api/v1/auth/login/`, `/api/v1/auth/register/`, `/api/v1/auth/logout/`, `/api/v1/auth/me/`
- `/api/v1/posts/` for the feed, explore, create, and pagination
- `/api/v1/posts/<id>/`, `/api/v1/posts/<id>/like/`, `/api/v1/posts/<id>/comments/`
- `/api/v1/users/<username>/`, `/api/v1/users/<username>/follow/`
- `/api/v1/auth/profile/` and `/api/v1/search/`

## Structure

- `connectly/` – project settings, root URLs, and React shell
- `core/` – models, forms, API, admin, and server-rendered legacy views
- `frontend/src/` – React app and Tailwind styles
- `static/app/` – Vite production build served by Django
- Uploaded images go to `media/` (served automatically when DEBUG=True)

Before deploying: set `DJANGO_DEBUG=false`, `DJANGO_SECRET_KEY`, and `DJANGO_ALLOWED_HOSTS`, then run `collectstatic` and use a production WSGI/ASGI server.
