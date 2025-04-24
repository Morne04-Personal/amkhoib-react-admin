# Amkhoib React Admin Application

This repository contains the source code for the Amkhoib React Admin application. It utilizes Vite for building and is containerized using Docker for easy deployment.


## Building Docker Images

The application uses a multi-stage Docker build to create optimized images for both development and production.

### 1. Development Image

To build the development image:

```bash
$dev_tag = "ghcr.io/hyperboliq/amkhoib-react-admin:dev"
docker build --build-arg BUILD_ENV=development --build-arg ENV_FILE_PATH=.env.development -t $dev_tag .
```

Build arguments:
- `--build-arg BUILD_ENV=development`: Sets the build environment to development
- `--build-arg ENV_FILE_PATH=.env.development`: Sets the path for the .env file to be used
- `-t ghcr.io/hyperboliq/amkhoib-react-admin:dev`: Tags the image with the name and tag

### 2. Production Image

To build the production image:

```bash
$prod_tag = "ghcr.io/hyperboliq/amkhoib-react-admin:prod"
docker build --build-arg BUILD_ENV=production --build-arg ENV_FILE_PATH=.env.production -t $prod_tag .
```

Build arguments:
- `--build-arg BUILD_ENV=production`: Sets the build environment to production
- `--build-arg ENV_FILE_PATH=.env.production`: Sets the path for the .env file to be used
- `-t ghcr.io/hyperboliq/amkhoib-react-admin:prod`: Tags the image with the name and tag

**Important:**
- Ensure you are logged in to the GitHub Container Registry using `docker login ghcr.io` before pushing the images
- If you modify .env files, you will need to rebuild the images for those changes to take effect
- You can add the `--no-cache` option to your build command (e.g. `docker build --no-cache ...`) to avoid using the docker cache. This will make sure the changes you've made are picked up

## Pushing Docker Images

To push the created images to the registry:

```bash
docker push ghcr.io/hyperboliq/amkhoib-react-admin:dev
docker push ghcr.io/hyperboliq/amkhoib-react-admin:prod
```

## Deploying with Docker Compose

The application can be deployed using Docker Compose for both development and production environments. Here are the configuration files:

### docker-compose.dev.yml
```yaml
version: "3.8"
services:
  web:
    image: ghcr.io/hyperboliq/amkhoib-react-admin:dev
    ports:
      - "3000:80" # Map host port 8080 to container port 80
    restart: always
    networks:
      - mynetwork
networks:
  mynetwork:
```

### docker-compose.prod.yml
```yaml
version: "3.8"
services:
  web:
    image: ghcr.io/hyperboliq/amkhoib-react-admin:prod
    ports:
      - "3000:80" # Map host port 80 to container port 80
    restart: always
    networks:
      - mynetwork
networks:
  mynetwork:
```

### 1. Development Environment

To start the development environment:

```bash
docker compose -f docker-compose.dev.yml up -d
```

This will start the application on http://localhost:8080.

To stop the development environment:

```bash
docker compose -f docker-compose.dev.yml down
```

### 2. Production Environment

To start the production environment:

```bash
docker compose -f docker-compose.prod.yml up -d
```

This will start the application on http://localhost:80.

To stop the production environment:

```bash
docker compose -f docker-compose.prod.yml down
```

## Environment Configuration

Environment variables are managed through .env files. The Dockerfile uses conditional logic to select the correct .env file during the build process. Here are example configurations for both environments:

### .env.development
```env
VITE_FRONTEND_PORT=5173
VITE_SUPABASE_URL=https://dev.db.amkhoib.org/
VITE_SUPABASE_ANON_KEY=[devEnvAnonKey]
VITE_DOCGEN_BACKEND_URL=http://dev.be.amkhoib.org/
VITE_ENV=development
```

### .env.production
```env
VITE_FRONTEND_PORT=3000
VITE_SUPABASE_URL=https://db.amkhoib.org
VITE_SUPABASE_ANON_KEY=[devEnvAnonKey]
VITE_DOCGEN_BACKEND_URL=https://be.amkhoib.org
VITE_ENV=production
```

**Note:** Make sure to update these environment variables according to your specific deployment requirements.

## Dockerfile Overview

The Dockerfile is a multi-stage build:

### Builder Stage:
- Sets up a Node.js environment
- Installs dependencies
- Copies source code
- Selects the correct .env file
- Builds the React application using Vite

### Server Stage:
- Uses a lightweight Nginx image
- Copies the built application from the builder stage
- Exposes port 80 internally
- Starts Nginx