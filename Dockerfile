FROM python:2

RUN apt-get update && apt-get install -y \
    graphviz \
    pkg-config

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000
CMD [ "uwsgi", "--ini", "app.ini" ]
