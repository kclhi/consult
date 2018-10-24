library(plumber)
r<-plumb('r-code-for-bp-alert.R')
r$run(port=8000)
