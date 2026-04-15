import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface User {
  id: string;
  name: string;
}

@WebSocketGateway(4000, {
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer() server: Server;

  private users: User[] = [];

  // ✅ When user connects
  handleConnection(client: Socket) {
    const name = client.handshake.query.name as string;

    this.users.push({
      id: client.id,
      name,
    });

    //broadcast everyone excluding current person
    client.broadcast.emit('user-joined', {
      name,
      message: `${name} joined the chat`,
    });
  }

  // ✅ When user disconnects
  handleDisconnect(client: Socket) {
    const user = this.users.find((u) => u.id === client.id);

    if (user) {
      //broadcast everyone including current person
      this.server.emit('user-left', `${user.name} left the chat`);
    }
    //delete the id from the users array
    this.users = this.users.filter((u) => u.id !== client.id);
  }

  // Join room
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    client.join(room);
    //only send to current person
    client.emit('joined-room', {
      room,
      message: `You joined ${room}`,
    });
    //broadcast everyone excluding current person
    client.broadcast.to(room).emit('user-joined', {
      message: `A user joined ${room}`,
    });
  }

  // Send message to room
  @SubscribeMessage('conversation')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string; message: string },
  ) {
    const user = this.users.find((u) => u.id === client.id);

    if (!user) return;
    //broadcast msg inside room to everyone including current person
    this.server.to(data.room).emit('conversation', {
      name: user.name,
      message: data.message,
    });
  }
}