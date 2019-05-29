# CONSULT Data Mining
# Initial code to flag raised blood pressure
# Isabel Sassoon, CONSULT, August 2018

library(ggplot2)
library(DBI)
library(RSQLite)
library(RMySQL)

bp.process<-function(pid, nn) {

  if ( Sys.getenv("R_ENV") == "production" ) {

    datadb<-dbConnect(MySQL(), user=Sys.getenv("MYSQL_USER"), password=Sys.getenv("MYSQL_PASSWORD"), dbname=Sys.getenv("MYSQL_DATABASE"), host=Sys.getenv("MYSQL_HOST"))

  } else {

    datadb<-dbConnect(SQLite(), "data.sqlite")

  }

  # Get all data.
  bp<-dbGetQuery(datadb, paste('SELECT * FROM bp WHERE pid="', pid, '"', "", sep=""));

  # Processing logic
  past<-head(bp, n=nn)
  c271649006.mean.past<-mean(past$c271649006)
  c271650006.mean.past<-mean(past$c271650006)
  recent<-tail(bp, n=1)
  c271649006.mean.recent<-mean(recent$c271649006)
  c271650006.mean.recent<-mean(recent$c271650006)

  if (c271649006.mean.recent>179){res.c271649006<-"Double Red Flag"}
  else if (c271649006.mean.recent<180 & c271649006.mean.recent>149) {res.c271649006<-"Red Flag"}
  else if (c271649006.mean.recent<150 & c271649006.mean.recent>134) {res.c271649006<-"Amber Flag"}
  else {res.c271649006<-"no alert"}
  # c271649006.alert.status<-cat("Mean c271649006 is: ",c271649006.mean.recent, res.c271649006)
  # return(c271649006.alert.status)

  if (c271650006.mean.recent>109){res.c271650006<-"Double Red Flag"}
  else if (c271650006.mean.recent<110 & c271650006.mean.recent>94) {res.c271650006<-"Red Flag"}
  else if (c271650006.mean.recent<95 & c271650006.mean.recent>84) {res.c271650006<-"Amber Flag"}
  else {res.c271650006<-"no alert"}
  #c271650006.alert.status<-cat(" Mean c271650006 is: ",c271650006.mean.recent, res.c271650006)
  # return(c271650006.alert.status)

  patient.facts<-tail(bp, n=1)
  alert.content<-data.frame(res.c271649006, res.c271650006, patient.facts)

  # Convert to json
  library(jsonlite)
  alertContent<-toJSON(alert.content)

  dbDisconnect(datadb)

  return(alertContent)

}

#* @apiTitle Data miner (data-miner)
#* @apiDescription Analyse patient sensor data.

#* Get latest blood pressure information
#* @param pid patient ID
#* @param nn history length -- ~MDC should this be a constant?
#* @post /mine/get/bp
bp.get<-function(pid, nn) {

  return(bp.process(bp$pid, nn));

}

#* @apiTitle Data miner (data-miner)
#* @apiDescription Analyse patient sensor data.

#* Check blood pressure for exacerbations
#* @param bp blood pressure data
#* @param nn history length -- ~MDC should this be a constant?
#* @param ehr patient facts
#* @post /mine/check/bp
bp.check<-function(bp, nn, ehr) {

  if ( Sys.getenv("R_ENV") == "production" ) {

    datadb<-dbConnect(MySQL(), user=Sys.getenv("MYSQL_USER"), password=Sys.getenv("MYSQL_PASSWORD"), dbname=Sys.getenv("MYSQL_DATABASE"), host=Sys.getenv("MYSQL_HOST"))

  } else {

    datadb<-dbConnect(SQLite(), "data.sqlite")

  }

  # Get CSV formatted input.
  values.str = gsub("\\n","\n",bp,fixed=T)
  bp<-read.csv(text=values.str)
  values.str = gsub("\\n","\n",ehr,fixed=T)
  ehr<-read.csv(text=values.str)

  # Add latest values to DB.

  # TODO: Delete from table if outside 'nn' length.
  dbWriteTable(datadb, "bp", merge(bp, ehr), append=TRUE);

  dbDisconnect(datadb);

  return(bp.process(bp$pid, nn));

  #future improvements:
  #Use dates, and check file is sorted by date before computing the means
  #additional indicators

}

#* Check heart rate for exacerbations
#* @param hr heart rate data
#* @param nn history length -- ~MDC should this be a constant?
#* @param ehr patient facts
#* @post /mine/check/hr
hr.check<-function(hr, nn, ehr) {

  if ( Sys.getenv("R_ENV") == "production" ) {

    datadb<-dbConnect(MySQL(), user=Sys.getenv("MYSQL_USER"), password=Sys.getenv("MYSQL_PASSWORD"), dbname=Sys.getenv("MYSQL_DATABASE"), host=Sys.getenv("MYSQL_HOST"))

  } else {

    datadb<-dbConnect(SQLite(), "data.sqlite")

  }

  # Get CSV formatted input.
  values.str = gsub("\\n","\n",hr,fixed=T)
  hr<-read.csv(text=values.str)
  values.str = gsub("\\n","\n",ehr,fixed=T)
  ehr<-read.csv(text=values.str)

  # Add latest values to DB.
  # TODO: Delete from table if outside 'nn' length.
  dbWriteTable(datadb, "hr", merge(hr, ehr), append=TRUE)

  # Get all data.
  hr<-dbGetQuery(datadb, paste('SELECT * FROM hr WHERE pid="', hr$pid, '"', "", sep=""))

  # Mining logic

  dbDisconnect(datadb)
  
  return("HR received.")

}
