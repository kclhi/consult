 cp -R /home/nadin/uploads/jan19-2/reasoner/* .
 git add .
 git commit -m "Update"
 pkill -f ssh-agent
 eval "$(ssh-agent -s)"
 ssh-add /home/martin/.ssh/consult-test-environment
 git push

