const Client = require('../models/client.js');
const Bean = require('../models/bean.js');
const Room = require('../models/room.js');
const Types = require('mongoose').Types;

module.exports = (router) => {
    // Client CURD
    router.route('/client')

        // create a client
        .post((req, res) => {
            
            let client = new Client(req.body); // create a new instance of the Client model

            // save the client and check for errors
            client.save().then(client => {
                res.json(client);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
            
        })

        // get all the clients
        .get((req, res) =>{

            const limit = +req.query.limit || 20;
            let skip = +req.query.skip || 0;

            let query = Client.find();

            if(req.query.page && !skip) {
                skip = (req.query.page - 1) * limit;
            }

            if(req.query.institution) {
                query.find({'institution._id': req.query.institution});
            }
            else if(req.user.roles.indexOf('admin') === -1) {
                query.find({
                    'institution._id': req.user.institution._id
                });
            }

            if (req.query.family === '-') {
                query.find({$or: [{families: {$exists: false}}, {families: {$size: 0}}]});
            }

            query.count()
            .then((total) => {
                return Promise.all([total,
                    query.find().limit(limit).skip(skip).exec()
                ]);
            })
            .then((result) => {
                let [total, page] = result;

                if(skip + page.length > total) {
                    total = skip + page.length;
                }

                res.set('items-total', total)
                .set('items-start', Math.min(skip + 1, total))
                .set('items-end', Math.min(skip + limit, total))
                .json(page);
            });
        });

    // on routes that end in /client/:clientId
    // ----------------------------------------------------
    router.route('/client/:clientId')

        // get the client with that id
        .get((req, res) =>{
            Client.findById(req.params.clientId).then(client => {
                res.json(client);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        .put((req, res) => {

            Client.findByIdAndUpdate(req.params.clientId, req.body, {new: true})
            .then(client => {

                // 绑定传感器
                if (client.bean) {
                    Bean.findByIdAndUpdate(client.bean._id, {client: client}).exec();
                }

                res.json(client);

                if (client.room) {
                    console.log('addToSet', client.room._id, {
                        _id: Types.ObjectId(client._id),
                        name: client.name
                    });
                    Room.findByIdAndUpdate(client.room._id, {$addToSet: {clients: {
                        _id: Types.ObjectId(client._id),
                        name: client.name
                    }}}).exec();
                }
            })
            .catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        // delete the client with this id
        .delete((req, res) =>{
            Client.findByIdAndRemove(req.params.clientId).then(() => {
                res.end();
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        });

    return router;
}
