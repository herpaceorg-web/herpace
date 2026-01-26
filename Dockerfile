# Multi-stage Dockerfile for HerPace.API
# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["HerPace.sln", "./"]
COPY ["backend/src/HerPace.API/HerPace.API.csproj", "backend/src/HerPace.API/"]
COPY ["backend/src/HerPace.Core/HerPace.Core.csproj", "backend/src/HerPace.Core/"]
COPY ["backend/src/HerPace.Infrastructure/HerPace.Infrastructure.csproj", "backend/src/HerPace.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "backend/src/HerPace.API/HerPace.API.csproj"

# Copy all source files
COPY backend/src/ backend/src/

# Build the application
WORKDIR /src/backend/src/HerPace.API
RUN dotnet build "HerPace.API.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "HerPace.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install Cloud SQL Proxy (for connecting to Cloud SQL)
RUN apt-get update && apt-get install -y wget && \
    wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy && \
    chmod +x cloud_sql_proxy && \
    mv cloud_sql_proxy /usr/local/bin/

# Copy published app
COPY --from=publish /app/publish .

# Expose port
EXPOSE 8080

# Set environment variable for ASP.NET Core
ENV ASPNETCORE_URLS=http://+:8080

# Run the application
ENTRYPOINT ["dotnet", "HerPace.API.dll"]
