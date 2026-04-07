import { Kafka, Producer, Consumer } from 'kafkajs';

export class EventBroker {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();

  constructor(clientId: string, brokers: string[]) {
    this.kafka = new Kafka({
      clientId,
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      console.log('✅ Connected to Kafka DataBroker');
    } catch (error) {
      console.error('❌ Failed to connect to Kafka DataBroker:', error);
    }
  }

  async publish(topic: string, events: any[]): Promise<boolean> {
    try {
      const messages = events.map(event => {
        // Enforce Idempotency Hash (MD5 logic implemented here normally)
        return {
          key: event.idempotencyKey || event.tenant_id, 
          value: JSON.stringify(event)
        };
      });

      await this.producer.send({
        topic,
        messages,
      });

      return true;
    } catch (error) {
      console.error(`❌ Failed to publish to ${topic}:`, error);
      // Fallback: Send to DLQ or dead letter logging
      await this.publish('system_dlq_topic', events);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    for (const [_, consumer] of this.consumers) {
      await consumer.disconnect();
    }
  }
}

// Singleton instance (stub for now; ideally initialized safely in production)
export const broker = new EventBroker('databridge-core', process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092']);

// Optional explicit connect wrapper
export const initBroker = async () => {
    if (process.env.NODE_ENV !== 'development') {
        await broker.connect();
    }
};
