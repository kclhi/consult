FROM kclhi/plumber:latest

RUN sed -i -e 's/deb.debian.org/archive.debian.org/g' \
           -e 's|security.debian.org|archive.debian.org/|g' \
           -e '/stretch-updates/d' /etc/apt/sources.list
RUN apt-get update
RUN apt-get install -y libmariadb-dev-compat

# Install requirements
RUN R -e "install.packages('RSQLite')"
RUN R -e "install.packages('RMySQL')"
RUN R -e "install.packages('ggplot2')"

COPY . .
RUN touch data.sqlite

EXPOSE 3006

ENTRYPOINT ["R", "-e", "pr <- plumber::plumb( 'r-code-for-alert.R' ); pr$run( host='0.0.0.0', port=3006 )"]
