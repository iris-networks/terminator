# Get the short git commit hash
GIT_COMMIT := $(shell git rev-parse --short HEAD)
IMAGE_NAME := shanurcsenitap/iris
LATEST_TAG := $(IMAGE_NAME):latest
COMMIT_TAG := $(IMAGE_NAME):$(GIT_COMMIT)

deploy:
	docker buildx build --platform linux/amd64 -t $(LATEST_TAG) -t $(COMMIT_TAG) . --push
	@$(MAKE) update-readme

build:
	docker buildx build --platform linux/amd64 -t $(LATEST_TAG) -t $(COMMIT_TAG) .

run:
	docker run -it --rm $(LATEST_TAG)

build-run: build run

build-amd64:
	docker buildx build --platform linux/amd64 -t $(LATEST_TAG) -t $(COMMIT_TAG) . --push
	@$(MAKE) update-readme

exec:
	docker run -it --rm \
		-e API_KEY=$(API_KEY) \
		-e DISPLAY=$(DISPLAY) \
		-e PROVIDER=$(PROVIDER) \
		-e MODEL=$(MODEL) \
		-p 3001:3001 \
		-p 3000:3000 \
		$(LATEST_TAG) \
		/app/start-server.sh

update-readme:
	@echo "Updating README with latest Docker tag: $(COMMIT_TAG)"
	@sed -i '' 's|docker run -it --rm shanurcsenitap/iris:[a-zA-Z0-9]*|docker run -it --rm $(COMMIT_TAG)|g' README.md || true
	@sed -i '' 's|shanurcsenitap/iris:[a-zA-Z0-9]*|$(COMMIT_TAG)|g' README.md || true