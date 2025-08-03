deploy:
	docker buildx build --platform linux/amd64 -t shanurcsenitap/iris:latest . --push

build:
	docker buildx build --platform linux/amd64 -t shanurcsenitap/iris:latest .

run:
	docker run -it --rm shanurcsenitap/iris:latest

build-run: build run

build-amd64:
	docker buildx build --platform linux/amd64 -t shanurcsenitap/iris:latest . --push

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