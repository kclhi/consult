FROM python:2

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000
CMD [ "uwsgi", "--ini", "app.ini" ]
