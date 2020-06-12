import express from "express"
import path from "path"
import http from "http"
import socketIO from "socket.io"

const port: number = 3000

class App {
    private server: http.Server
    private port: number

    private io: socketIO.Server
    private peers: any = {}

    constructor(port: number) {
        this.port = port
        const app = express()
        app.use(express.static(path.join(__dirname, '../client')))
        app.use('/build/three.module.js', express.static(path.join(__dirname, '../../node_modules/three/build/three.module.js')))
        app.use('/jsm/controls/OrbitControls', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/controls/OrbitControls.js')))
        app.use('/jsm/libs/stats.module', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/libs/stats.module.js')))
        app.use('/jsm/libs/dat.gui.module', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/libs/dat.gui.module.js')))
        app.use('/jsm/libs/tween.module.min', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/libs/tween.module.min.js')))

        this.server = new http.Server(app);

        this.io = socketIO(this.server);

        this.io.on('connection', (socket: socketIO.Socket) => {
            this.peers[socket.id] = {}
            console.log(this.peers)
            console.log('a user connected : ' + socket.id)
            socket.emit("id", socket.id);

            socket.on('disconnect', () => {
                console.log('socket disconnected : ' + socket.id)
                if (this.peers && this.peers[socket.id]) {
                    console.log("deleting " + socket.id)
                    delete this.peers[socket.id]
                    this.io.emit("removePeer", socket.id)
                }
            })

            socket.on("update", (message: any) => {
                if (this.peers[socket.id]) {
                    this.peers[socket.id].t = message.t //client timestamp
                    this.peers[socket.id].p = message.p //position
                    this.peers[socket.id].r = message.r //rotation
                }
            });
        })

        setInterval(() => {
            this.io.emit("peers", this.peers)
        }, 50)
    }

    public Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`)
        })
    }
}

new App(port).Start()