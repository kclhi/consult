switch(s1).
switch(s2).
switch(s3).
lamp(l).
relay(r).

event(open(S)) :- switch(S).
event(close(S)) :- switch(S).
event(activate(R)) :- relay(R).
event(light(L)) :- lamp(L).
fluent(closed(S)) :- switch(S).
fluent(activated(R)) :- relay(R).
fluent(lit(L)) :- lamp(L).

initiates(close(S),closed(S),T) :- switch(S), time(T).
terminates(open(S),closed(S),T) :- switch(S), time(T).
initiates(activate(R),activated(R),T) :- relay(R), time(T).
initiates(light(L),lit(L),T) :- lamp(L), time(T).

happens(light(l),T) :- stopped(lit(l),T), initiated(closed(s1),T),
  initiated(closed(s2),T), time(T).

happens(open(s2),T) :- started(closed(s2),T), initiated(activated(r),T),
  time(T).

happens(activate(r),T) :- stopped(activated(r),T),
  initiated(closed(s1),T), initiated(closed(s3),T), time(T).

:- holdsAt(closed(s1),0).
holdsAt(closed(s2),0).
holdsAt(closed(s3),0).
:- holdsAt(activated(r),0).
:- holdsAt(lit(l),0).

happens(close(s1),1).

:- releasedAt(F,0), fluent(F).

