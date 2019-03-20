FROM trestletech/plumber

# Install requirements
RUN R -e "install.packages('RSQLite')"
RUN R -e "install.packages('ggplot2')"

COPY . .

EXPOSE 3006

ENTRYPOINT ["R", "-e", "pr <- plumber::plumb( 'r-code-for-alert.R' ); pr$run( host='0.0.0.0', port=3006 )"]
