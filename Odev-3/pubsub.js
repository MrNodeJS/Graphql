const {RedisPubSub} = require('graphql-redis-subscriptions');
const Redis         = require('ioredis');

const options = {
	host         : "HOST-URL",
	port         : 13002,
	password     : "host-pass",
	retryStrategy: times => {
		return Math.min(times * 50, 2000);
	}
};

const pubsub = new RedisPubSub({
	publisher : new Redis(options),
	subscriber: new Redis(options)
});

module.exports = pubsub;