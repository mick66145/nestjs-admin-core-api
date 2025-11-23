### Used when deployed as a single project
# PROJECT_NAME=app
# IMAGE_NAME=$(PROJECT_NAME)-base
# APP_PATH=/app/$(PROJECT_NAME)/dev/deploy/app
# APP_NETWORK=$(PROJECT_NAME)_app_network

### Used when deployed as an app under a project (group of microservices)
PROJECT_NAME=nestjs
APP_NAME=app
APP_PATH=/app/$(PROJECT_NAME)/dev/deploy/$(APP_NAME)
APP_NETWORK=$(PROJECT_NAME)_app_network

# used when App uses the shared project image
IMAGE_NAME=$(PROJECT_NAME)-base
# used when App needs its own image
# IMAGE_NAME=$(APP_NAME)-base

VERSION=1.0
CONTEXT=..
DOCKERFILE=./Dockerfile
DEV_IMAGE=$(IMAGE_NAME):dev-$(VERSION)
PROD_IMAGE=$(IMAGE_NAME):prod-$(VERSION)

buDev:
	DOCKER_BUILDKIT=1 docker build -f $(DOCKERFILE) --target=dev --tag=$(DEV_IMAGE) $(CONTEXT)

buProd:
	DOCKER_BUILDKIT=1 docker build -f $(DOCKERFILE) --target=final --tag=$(PROD_IMAGE) $(CONTEXT)

buAll: buDev buProd

runDev:
	docker run -it --rm $(DEV_IMAGE) sh

genPrisma:
	docker run -it --rm -u root \
	  -v $$(pwd)/$(CONTEXT)/prisma:/app/prisma:ro \
	  -v $$(pwd)/app/prisma_client:/app/prisma_client \
		$(DEV_IMAGE) \
		sh -c 'npx prisma generate && cp -r node_modules/.prisma/* prisma_client/'

genPrismaSeed:
	docker run -it --rm --network=$(APP_NETWORK) \
	  -v $$(pwd)/$(CONTEXT)/prisma:/app/prisma:ro \
	  -v $$(pwd)/$(CONTEXT)/src:/app/src:ro \
	  -v $(APP_PATH)/.env:/app/.env:ro \
		$(DEV_IMAGE) \
		sh -c 'npx prisma db seed'

genDist:
	docker run -it --rm -u root \
		-v $$(pwd)/$(CONTEXT)/src:/app/src:ro \
		-v $$(pwd)/$(CONTEXT)/nest-cli.json:/app/nest-cli.json:ro \
		-v $$(pwd)/$(CONTEXT)/package.json:/app/package.json:ro \
		-v $$(pwd)/$(CONTEXT)/tsconfig.json:/app/tsconfig.json:ro \
		-v $$(pwd)/$(CONTEXT)/tsconfig.build.json:/app/tsconfig.build.json:ro \
	  -v $$(pwd)/app/prisma_client:/app/node_modules/.prisma:ro \
		-v $$(pwd)/app/dist:/app/dist \
		$(DEV_IMAGE) \
		sh -c 'npm run build'

genAll: genPrisma genDist

migrateDeploy:
	docker run -it --rm --network=$(APP_NETWORK) \
	  -v $$(pwd)/$(CONTEXT)/prisma:/app/prisma:ro \
	  -v $(APP_PATH)/.env:/app/.env:ro \
		$(DEV_IMAGE) \
		sh -c 'npx prisma migrate deploy'

deployApp:
	cp -r ./app/* $(APP_PATH)/
