# Backend Dockerfile for Cloud Run
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY src/HerPace.API/HerPace.API.csproj src/HerPace.API/
COPY src/HerPace.Core/HerPace.Core.csproj src/HerPace.Core/
COPY src/HerPace.Infrastructure/HerPace.Infrastructure.csproj src/HerPace.Infrastructure/

# Restore dependencies
RUN dotnet restore src/HerPace.API/HerPace.API.csproj

# Copy all source code
COPY src/ src/

# Build and publish
WORKDIR /src/src/HerPace.API
RUN dotnet publish -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

# Set environment for Cloud Run
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "HerPace.API.dll"]
