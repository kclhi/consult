FROM kclhi/plumber:latest

RUN sed -i -e 's/deb.debian.org/archive.debian.org/g' \
           -e 's|security.debian.org|archive.debian.org/|g' \
           -e '/stretch-updates/d' /etc/apt/sources.list
RUN apt-get update
RUN apt-get install -y libmariadb-dev-compat

# Install requirements
RUN R -e "require('remotes'); install_version('DBI', version='1.1.1', upgrade='never', repos='http://cran.us.r-project.org')"
RUN R -e "require('remotes'); install_version('ggplot2', version='3.3.6', upgrade='never', repos='http://cran.us.r-project.org')"
RUN R -e "require('remotes'); install_version('RMySQL', version='0.10.23', upgrade='never', repos='http://cran.us.r-project.org')"

COPY . .

EXPOSE 3006

ENTRYPOINT ["R", "-e", "pr <- plumber::plumb( 'r-code-for-alert.R' ); pr$run( host='0.0.0.0', port=3006 )"]
