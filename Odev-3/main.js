const {events, locations, users, participants} = require('./data.json');
const {createServer}                           = require('@graphql-yoga/node');
const pubsub                                   = require('./pubsub');

let generateID = () => parseInt(Date.now().toString().slice(5));

const typeDefs  = /* GraphQL */ `
    type deletedOutput{
        count:Int!
    }

    type Event{
        id: Int!
        title: String
        desc: String
        date: String
        from: String
        to: String
        location_id: Int
        user_id: Int!
        user:User!
        location:Location!
        participants:[Participant!]!
    }
    input createEventInput{
        title: String,
        desc: String,
        date: String,
        from: String,
        to: String,
        location_id: Int,
        user_id: Int!
    }
    input updateEventInput{
        title: String
        desc: String
        date: String
        from: String
        to: String
        location_id: Int
        user_id: Int
    }

    type Location{
        id: Int!
        name: String
        desc: String
        lat: Float
        lng: Float
    }
    input createLocationInput{
        name: String
        desc: String
        lat: Float
        lng: Float
    }
    input updateLocationInput{
        name: String
        desc: String
        lat: Float
        lng: Float
    }

    type User{
        id: Int!
        username: String
        email: String
    }
    input createUserInput{
        username:String!,
        email:String!
    }
    input updateUserInput{
        username:String,
        email:String
    }

    type Participant{
        id: Int!
        user_id: Int!
        event_id: Int!
    }
    input createParticipantInput{
        user_id: Int!
        event_id: Int!
    }
    input updateParticipantInput{
        user_id: Int
        event_id: Int
    }

    type Query{
        users: [User!]!
        user(id:Int!): User!

        events: [Event!]!
        event(id:Int!): Event!

        locations:[Location!]!
        location(id:Int!):Location!

        participants:[Participant!]!
        participant(id:Int!):Participant!
    }

    type Mutation{
        createUser(data:createUserInput!):User!
        createEvent(data:createEventInput!):Event!
        createLocation(data:createLocationInput!):Location!
        createParticipant(data:createParticipantInput!):Participant!

        updateUser(id:Int!,data:updateUserInput!):User!
        updateEvent(id:Int!,data:updateEventInput!):Event!
        updateLocation(id:Int!,data:updateLocationInput!):Location!
        updateParticipant(id:Int!,data:updateParticipantInput!):Participant!

        deleteUser(id:Int!):User!
        deleteEvent(id:Int!):Event!
        deleteLocation(id:Int!):Location!
        deleteParticipant(id:Int!):Participant!

        deleteAllUser:deletedOutput!
        deleteAllEvent:deletedOutput!
        deleteAllLocation:deletedOutput!
        deleteAllParticipant:deletedOutput!
    }

    type Subscription{
        userCreated: User!
        eventCreated: Event!
        locationCreated:Event!
        participantCreated: Participant!
    }
`;

const resolvers = {
	Query       : {
		users: () => users,
		user : (parents, args) => users.find(user => Number(user.id) === args.id),

		events: () => events,
		event : (parents, args) => events.find(event => Number(event.id) === args.id),

		locations: () => locations,
		location : (parent, args) => locations.find(location => Number(location.id) === args.id),

		participants: () => participants,
		participant : (parent, args) => participants.find(participant => Number(participant.id) === args.id)
	},
	Event       : {
		user        : (parent) => users.find(user => user.id === parent.user_id),
		location    : (parent) => locations.find(location => location.id === parent.user_id),
		participants: (parent) => participants.filter(participant => participant.id === parent.user_id)
	},
	Mutation    : {
		createUser       : (parent, {data}) => {
			const newUser = {
				id: generateID(),
				...data
			};
			users.push(newUser);
			pubsub.publish('userCreated', {userCreated: newUser});
			return newUser;
		},
		createEvent      : (parent, {data}) => {
			const newEvent = {
				id: generateID(),
				...data
			};
			events.push(newEvent);
			pubsub.publish('eventCreated', {eventCreated: newEvent});
			return newEvent;
		},
		createLocation   : (parent, {data}) => {
			const newLocation = {
				id: generateID(),
				...data
			};
			locations.push(newLocation);
			pubsub.publish('locationCreated', {locationCreated: newLocation});
			return newLocation;
		},
		createParticipant: (parent, {data}) => {
			const newParticipant = {
				id: generateID(),
				...data
			};
			participants.push(newParticipant);
			pubsub.publish('participantCreated', {participantCreated: newParticipant});
			return newParticipant;
		},

		updateUser       : (parent, {id, data}) => {
			let index = users.findIndex(user => user.id === id);
			if (index === -1)
				throw new Error(`No user exists with id ${id}`);

			users[index] = {
				...users[index],
				...data
			};

			return users[index];
		},
		updateEvent      : (parent, {id, data}) => {
			let index = events.findIndex(event => event.id === id);
			if (index === -1)
				throw new Error(`No event exists with id ${id}`);

			events[index] = {
				...events[index],
				...data
			};

			return events[index];
		},
		updateLocation   : (parent, {id, data}) => {
			let index = locations.findIndex(location => location.id === id);
			if (index === -1)
				throw new Error(`No locations exists with id ${id}`);

			locations[index] = {
				...locations[index],
				...data
			};

			return locations[index];
		},
		updateParticipant: (parent, {id, data}) => {
			let index = participants.findIndex(participant => participant.id === id);
			if (index === -1)
				throw new Error(`No participant exists with id ${id}`);

			participants[index] = {
				...participants[index],
				...data
			};

			return participants[index];
		},

		deleteUser       : (parent, {id}) => {
			let index = users.findIndex(user => user.id === id);
			if (index === -1)
				throw new Error(`No user exists with id ${id}`);

			let deleted = users[id];
			users.splice(index, 1);
			return deleted;
		},
		deleteEvent      : (parent, {id}) => {
			let index = events.findIndex(event => event.id === id);
			if (index === -1)
				throw new Error(`No event exists with id ${id}`);

			let deleted = events[id];
			events.splice(index, 1);
			return deleted;
		},
		deleteLocation   : (parent, {id}) => {
			let index = locations.findIndex(location => location.id === id);
			if (index === -1)
				throw new Error(`No location exists with id ${id}`);

			let deleted = locations[id];
			locations.splice(index, 1);
			return deleted;
		},
		deleteParticipant: (parent, {id}) => {
			let index = participants.findIndex(participant => participant.id === id);
			if (index === -1)
				throw new Error(`No user participant with id ${id}`);

			let deleted = participants[id];
			participants.splice(index, 1);
			return deleted;
		},

		deleteAllUser       : () => {
			let len      = users.length;
			users.length = 0;
			return {count: len};
		},
		deleteAllEvent      : () => {
			let len       = events.length;
			events.length = 0;
			return {count: len};
		},
		deleteAllLocation   : () => {
			let len          = locations.length;
			locations.length = 0;
			return {count: len};
		},
		deleteAllParticipant: () => {
			let len             = participants.length;
			participants.length = 0;
			return {count: len};
		},
	},
	Subscription: {
		userCreated          : {
			subscribe: (_, __, {pubsub}) => pubsub.asyncIterator('userCreated')
		}, eventCreated      : {
			subscribe: (_, __, {pubsub}) => pubsub.asyncIterator('eventCreated')
		}, locationCreated   : {
			subscribe: (_, __, {pubsub}) => pubsub.asyncIterator('locationCreated')
		}, participantCreated: {
			subscribe: (_, __, {pubsub}) => pubsub.asyncIterator('participantCreated')
		}
	}
};

const server = createServer({
	schema    : {
		typeDefs,
		resolvers,
	}, context: {
		pubsub
	}
});

server.start();