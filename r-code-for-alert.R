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
#* @post /check/bp
bp.check<-function(bp, nn, ehr) {

  # Get CSV formatted input.
  values.str = gsub("\\n","\n",bp,fixed=T)
  bp<-read.csv(text=values.str)

  # Add latest values to DB.
  datadb<-dbConnect(RSQLite::SQLite(), "data.sqlite")

  # TODO: Delete from table if outside 'nn' length.
  dbWriteTable(datadb, "bp", bp, append=TRUE)

  # Get all data.
  bp<-dbGetQuery(datadb, 'SELECT * FROM bp')
  past<-head(bp, n=as.numeric(nn))
  p1<-mean(past$c271649006)
  recent<-tail(bp, n=as.numeric(nn))
  p2<-mean(recent$c271649006)
  diffr<-(p1/p2)

  if (diffr<1) {res<-"Raised Systolic BP"}
  else if (diffr==1) {res<-"Systolic BP Stable"}
  else {res<-"Lower Systolic BP"}

  # Creating the additional information from the patient stats
  bp.trend<-res
  patient.id<-toString(bp$pid[[1]])
  recent<-tail(bp, n=1)
  last.sys<-recent$c271649006
  last.dia<-recent$c271650006
  patient.facts<-data.frame(patient.id,bp.trend, last.sys, last.dia)
  patient.ehr.facts<-data.frame(patient.facts,ehr)

  #convert to json
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
#* @post /check/hr
hr.check<-function(hr, nn, ehr) {

  # Get CSV formatted input.
  values.str = gsub("\\n","\n",hr,fixed=T)
  hr<-read.csv(text=values.str)

  # Add latest values to DB.
  datadb<-dbConnect(RSQLite::SQLite(), "data.sqlite")

  # TODO: Delete from table if outside 'nn' length.
  dbWriteTable(datadb, "hr", hr, append=TRUE)

  # Get all data.
  bp<-dbGetQuery(datadb, 'SELECT * FROM hr')

  # Mining logic

  dbDisconnect(datadb)

  return("HR received.")

}

bp.plot<-function(){
  bp<-read.csv("data/bp-cs-p123.csv")
  ggplot(bp, aes(seq, sys)) + geom_line() +  xlab("Days") + ylab("BP Systolic")+stat_smooth(method = "loess")

  p = ggplot() +
    geom_line(data = bp, aes(x = seq, y = sys), color = "blue") +
    geom_line(data = bp, aes(x = seq, y = dia), color = "red") +
    geom_line(data = bp, aes(x = seq, y = hr), color = "grey") +
    xlab('Dates') +
    ylab('Blood pressure') +
    theme_bw() +
    ggtitle("SBP, DBP and Heat rate for P123")+
    scale_colour_manual(name='', values = c('SBP'='blue', 'DBP'="red", 'HR'="grey"), guide='legend') +
    guides(colour=guide_legend(override.aes = list(linecolour=c(1,1,1))))

  print(p)
}
