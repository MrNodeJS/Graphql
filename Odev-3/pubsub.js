const {RedisPubSub} = require('graphql-redis-subscriptions');
const Redis         = require('ioredis');

const options = {
	host         : "redis-13002.c270.us-east-1-3.ec2.cloud.redislabs.com",
	port         : 13002,
	password     : "zNvZWAhnpCunrJOKOCnX2MBlesUSqR0z",
	retryStrategy: times => {
		return Math.min(times * 50, 2000);
	}
};

const pubsub = new RedisPubSub({
	publisher : new Redis(options),
	subscriber: new Redis(options)
});

module.exports = pubsub;