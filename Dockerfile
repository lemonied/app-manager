FROM node:14.16.1
COPY . /app
RUN cd /app \
    && npm install
WORKDIR /app
ENV PORT=80 NODE_ENV=production
EXPOSE $PORT
CMD npm run start
