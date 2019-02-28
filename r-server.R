library('plumber')
r<-plumb('r-code-for-alert.R')
r$run(port=3003, swagger=TRUE)
