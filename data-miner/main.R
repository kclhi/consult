library('plumber')

pr <- plumb( 'r-code-for-alert.R' )

pr$run( port=3006, swagger=TRUE )
