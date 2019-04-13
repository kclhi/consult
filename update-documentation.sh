wget http://localhost:3006/swagger.json
spectacle swagger.json
rm -r docs
mv public docs
rm swagger.json
