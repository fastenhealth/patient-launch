serve-backend:
	docker run -p 8080:80 -e FHIR_SERVER_R4=https://api.medplum.com/fhir/R4 aehrc/smart-launcher-v2:latest