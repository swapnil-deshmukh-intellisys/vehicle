source venv/bin/activate

pkill gunicorn

gunicorn GMS.wsgi:application \
  --daemon \
  --bind 0.0.0.0:8000 \
  --access-logfile /var/log/gunicorn-access.log \
  --error-logfile /var/log/gunicorn-error.log

sudo systemctl reload nginx