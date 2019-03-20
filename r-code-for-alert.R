# CONSULT Data Mining
# Initial code to flag raised blood pressure
# Isabel Sassoon, CONSULT, August 2018

library(ggplot2)
library(DBI)

#* @apiTitle Data miner (data-miner)
#* @apiDescription Analyse patient sensor data.

#* Check blood pressure for exacerbations
#* @param bp blood pressure data
#* @param nn history length -- ~MDC should this be a constant?
#* @param ehr patient facts
#* @post /mine/check/bp
bp.check<-function(bp, nn, ehr) {

  # Get CSV formatted input.
  values.str = gsub("\\n","\n",bp,fixed=T)
  bp<-read.csv(text=values.str)
  values.str = gsub("\\n","\n",ehr,fixed=T)
  ehr<-read.csv(text=values.str)

  # Add latest values to DB.
  datadb<-dbConnect(RSQLite::SQLite(), "data.sqlite")

  # TODO: Delete from table if outside 'nn' length.
  dbWriteTable(datadb, "bp", merge(bp, ehr), append=TRUE)

  # Get all data.
  bp<-dbGetQuery(datadb, 'SELECT * FROM bp')

  # Processing logic
  bp$sbp<-bp$c271649006 # matches the code
  bp$dbp<-bp$c271650006
  bp$hr<-bp$c8867h4
  past<-head(bp, n=nn)
  sbp.mean.past<-mean(past$sbp)
  dbp.mean.past<-mean(past$dbp)
  recent<-tail(bp, n=nn)
  sbp.mean.recent<-mean(recent$sbp)
  dbp.mean.recent<-mean(recent$dbp)

  if (sbp.mean.recent>179){res.sbp<-"Double Red Flag"}
  else if (sbp.mean.recent<180 & sbp.mean.recent>149) {res.sbp<-"Red Flag"}
  else {res.sbp<-"no flag"}
  sbp.alert.status<-cat("Mean SBP is: ",sbp.mean.recent, res.sbp)

  # 109 - ~MDC temporarily trigger alert
  if (dbp.mean.recent>0){res.dbp<-"Double Red Flag"}
  else if (dbp.mean.recent<110 & dbp.mean.recent>94) {res.dbp<-"Red Flag"}
  else {res.dbp<-"no flag"}
  dbp.alert.status<-cat(" Mean DBP is: ",dbp.mean.recent, res.dbp)

  bp.alert.status<-cat(sbp.alert.status, " and ", dbp.alert.status)

  # Creating additional information from the patient stats
  bp.trend<-res.dbp
  patient.id<-toString(bp$pid[[1]])
  recent<-tail(bp, n=1)
  last.sys<-recent$c271649006
  last.dia<-recent$c271650006
  patient.facts<-data.frame(patient.id, bp.trend, last.sys, last.dia)
  patient.ehr.facts<-data.frame(patient.facts, ehr)

  # Convert to json
  library(jsonlite)
  patientFacts<-toJSON(patient.ehr.facts)

  dbDisconnect(datadb)

  return(patientFacts)

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

  # Get CSV formatted input.
  values.str = gsub("\\n","\n",hr,fixed=T)
  hr<-read.csv(text=values.str)
  values.str = gsub("\\n","\n",ehr,fixed=T)
  ehr<-read.csv(text=values.str)

  # Add latest values to DB.
  datadb<-dbConnect(RSQLite::SQLite(), "data.sqlite")

  # TODO: Delete from table if outside 'nn' length.
  dbWriteTable(datadb, "hr", merge(hr, ehr), append=TRUE)

  # Get all data.
  hr<-dbGetQuery(datadb, 'SELECT * FROM hr')

  # Mining logic
  hr$heart.rate.resting<-hr$c40443h4
  hr$heart.rate<-hr$c8867h4
  hr$exercise.freq<-hr$c82290h8

  dbDisconnect(datadb)

  return("HR received.")

}
