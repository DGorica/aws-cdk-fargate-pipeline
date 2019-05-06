# Start from golang v1.11 base image
FROM golang:1.11 as builder

# Set the Current Working Directory inside the container
WORKDIR /app
# Copy everything from the current directory to the PWD(Present Working Directory) inside the container
COPY . .
# Download all the dependencies
# https://stackoverflow.com/questions/28031603/what-do-three-dots-mean-in-go-command-line-invocations
RUN go get -d -v ./...
# Install the package
RUN go install -v ./...

# Run the build
RUN go build hello.go

######## Start a new stage from scratch #######
FROM alpine:latest  

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the Pre-built binary file from the previous stage
COPY --from=builder /hello .

EXPOSE 8080

CMD ["./hello"] 