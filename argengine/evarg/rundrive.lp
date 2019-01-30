agent(nathan).
location(bookstore).

fluent(tired(A)) :- agent(A).

event(go(A,L)) :- agent(A), location(L).
event(run(A,L)) :- agent(A), location(L).
event(drive(A,L)) :- agent(A), location(L).

happens(run(A,L),T) | happens(drive(A,L),T) :- happens(go(A,L),T).

initiates(run(A,L),tired(A),T) :- agent(A), location(L), time(T).

:- holdsAt(tired(nathan),0).
happens(go(nathan,bookstore),0).
holdsAt(tired(nathan),1).

:- releasedAt(F,0), fluent(F).

% ./clingo -c maxtime=1 -n 0 evarg/dec.lp evarg/rundrive.lp | ./format-output 1
