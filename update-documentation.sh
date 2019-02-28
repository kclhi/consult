wget http://localhost:3003/openapi.json
spectacle openapi.json
rm -r docs
mv public docs
rm openapi.json
