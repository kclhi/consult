#CONSULT Data Mining
#Initial code to flag raised blood pressure
#Isabel Sassoon, CONSULT, August 2018

#THis code assumes that all patient recent BP data is available and ordered into the file

setwd("/Users/isabelsassoon/Documents/CONSULT/case study june 18")

library(ggplot2)


bp.check<-function(nn){
  bp<-read.csv("bp-cs-p123.csv")
  past<-head(bp, n=nn)
  p1<-mean(past$sys)
  recent<-tail(bp, n=nn)
  p2<-mean(recent$sys)
  diffr<-(p1/p2)
  if (diffr<1) {res<-"Raised Systolic BP"}
  else if (diffr==1) {res<-"Systolic BP Stable"}
  else {res<-"Lower Systolic BP"}
  return(res) 
  #return(paste("BP trend", res, sep=":"))
}

bp.trend<-bp.check(7)

bp<-read.csv("bp-cs-p123.csv")
#creating the additional information from the patient stats
patient.id<-toString(bp$pid[[1]])

recent<-tail(bp, n=1)
last.sys<-recent$sys

last.dia<-recent$dia

patient.facts<-data.frame(patient.id,bp.trend, last.sys, last.dia)

#read in the ehr data (this is a dummy file for now)
ehr<-read.csv("ehr-cs-p123.csv")
patient.ehr.facts<-data.frame(patient.facts,ehr)

write.csv(patient.ehr.facts, file="patient-facts.csv", row.names = FALSE)


#convert to json

library(jsonlite)
x<-toJSON(patient.ehr.facts)
cat(x)

write_json(x,path = "patient-facts.json")


#future improvements:
#Use dates, and check file is sorted by date before computing the means
#additional indicators


bp.plot<-function(){
  bp<-read.csv("bp-cs-p123.csv")
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

bp.plot()
