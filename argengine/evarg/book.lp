agent(nathan).
object(book).
object(A) :- agent(A).
room(livingRoom).
room(kitchen).

event(letGoOf(A,O)) :- agent(A), object(O).
event(pickUp(A,O)) :- agent(A), object(O).
event(walk(A,R1,R2)) :- agent(A), room(R1), room(R2).
fluent(inRoom(O,R)) :- object(O), room(R).
fluent(holding(A,O)) :- agent(A), object(O).

initiates(walk(A,R1,R2),inRoom(A,R2),T) :-
  agent(A), room(R1), room(R2), time(T).

terminates(walk(A,R1,R2),inRoom(A,R1),T) :-
  R1!=R2, agent(A), room(R1), room(R2), time(T).

:- R1!=R2, holdsAt(inRoom(O,R1),T), holdsAt(inRoom(O,R2),T),
  object(O), room(R1), room(R2), time(T).

initiates(pickUp(A,O),holding(A,O),T) :-
  holdsAt(inRoom(A,R),T), holdsAt(inRoom(O,R),T),
  agent(A), object(O), room(R), time(T).

terminates(letGoOf(A,O),holding(A,O),T) :-
  holdsAt(holding(A,O),T), agent(A), object(O), time(T).

initiates(E,inRoom(O,R),T) :-
  initiates(E,inRoom(A,R),T), holdsAt(holding(A,O), T).

terminates(E,inRoom(O,R),T) :-
  terminates(E,inRoom(A,R),T), holdsAt(holding(A,O), T).

holdsAt(inRoom(nathan,livingRoom),0).
holdsAt(inRoom(book,livingRoom),0).
:- holdsAt(holding(nathan,book),0).
:- holdsAt(holding(A,A),T), agent(A).

happens(pickUp(nathan,book),0).
happens(walk(nathan,livingRoom,kitchen),1).
happens(letGoOf(nathan,book),2).
happens(walk(nathan,kitchen,livingRoom),3).

:- releasedAt(F,0), fluent(F).

% ./clingo -c maxtime=4 -n 0 evarg/dec.lp evarg/book.lp | ./format-output 4
