#CONSULT Data Mining
#Initial code to flag raised blood pressure
#Isabel Sassoon, CONSULT, August 2018

#THis code assumes that all patient recent BP data is available and ordered into the file

#setwd("/Users/isabelsassoon/Documents/CONSULT/case study june 18")

library(ggplot2)
library(DBI)

#* Check blood pressure
#* @param csv Data
#* @param nn History length -- ~MDC should this be a constant?
#* @post /check/bp
bp.check<-function(csv, nn) {
  # Get CSV formatted input.
  values.str = gsub("\\n","\n",csv,fixed=T)
  bp<-read.csv(text=values.str)
  # Add latest values to DB.
  bpdb<-dbConnect(RSQLite::SQLite(), "bp.sqlite")
  # TODO: Delete from table if outside 'nn' length.
  dbWriteTable(bpdb, "bp", bp, append=TRUE)
  # Get all data.
  bp<-dbGetQuery(bpdb, 'SELECT * FROM bp')
  past<-head(bp, n=as.numeric(nn))
  p1<-mean(past$c271649006)
  recent<-tail(bp, n=as.numeric(nn))
  p2<-mean(recent$c271649006)
  diffr<-(p1/p2)
  if (diffr<1) {res<-"Raised Systolic BP"}
  else if (diffr==1) {res<-"Systolic BP Stable"}
  else {res<-"Lower Systolic BP"}
  dbDisconnect(bpdb)
  return(res)
  #return(paste("BP trend", res, sep=":"))
}

#* Generate patient facts
#* @post /patientFacts
bp.patientFacts<-function(){
  bp.trend<-bp.check(7)

  bp<-read.csv("data/bp-cs-p123.csv")
  #creating the additional information from the patient stats
  patient.id<-toString(bp$pid[[1]])

  recent<-tail(bp, n=1)
  last.sys<-recent$sys

  last.dia<-recent$dia

  patient.facts<-data.frame(patient.id,bp.trend, last.sys, last.dia)

  #read in the ehr data (this is a dummy file for now)
  ehr<-read.csv("data/ehr-cs-p123.csv")
  patient.ehr.facts<-data.frame(patient.facts,ehr)

  write.csv(patient.ehr.facts, file="output/patient-facts.csv", row.names = FALSE)


  #convert to json

  library(jsonlite)
  x<-toJSON(patient.ehr.facts)
  cat(x)

  write_json(x,path = "output/patient-facts.json")
}

#future improvements:
#Use dates, and check file is sorted by date before computing the means
#additional indicators

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
