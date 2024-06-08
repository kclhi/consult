#!/usr/bin/env bash
set -eu
org=consult-ca

openssl genpkey -algorithm RSA -out consult.key -pkeyopt rsa_keygen_bits:4096
openssl req -x509 -key consult.key -days 365 -out consult.crt \
    -subj "/CN=$org/O=$org"
