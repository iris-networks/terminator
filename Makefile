deploy:
	docker build -t shanurcsenitap/iris:latest .
	docker push shanurcsenitap/iris:latest

build:
	docker build -t shanurcsenitap/iris:latest .

run:
	docker run -it --rm shanurcsenitap/iris:latest

build-run: build run

exec:
	docker run -it --rm \
		-e API_KEY=$(API_KEY) \
		-e DISPLAY=$(DISPLAY) \
		-e PROVIDER=$(PROVIDER) \
		-e MODEL=$(MODEL) \
		-p 3001:3001 \
		-p 3000:3000 \
		shanurcsenitap/iris:latest \
		/app/start-server.sh