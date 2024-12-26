// frontend/src/components/batch_processing/LiveFeed.tsx
import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {AlertCircle, CheckCircle, Clock} from 'lucide-react';
import {ProcessedItem} from '@/lib/types';

interface LiveFeedProps {
    processedItems: ProcessedItem[];
}

interface FeedItem {
    id: number;
    filename: string;
    status: 'success' | 'error';
    message: string;
    timestamp: string;
}

const LiveFeed: React.FC<LiveFeedProps> = ({processedItems}) => {
    // In a real app, you'd maintain a separate feed of processing events
    const feedItems: FeedItem[] = processedItems.slice().reverse().map(item => ({
        id: item.id,
        filename: item.filename,
        status: item.status === 'success' ? 'success' : 'error',
        message: item.status === 'success' ? 'Caption generated successfully' : 'Processing failed',
        timestamp: new Date(item.timestamp).toLocaleTimeString(),
    }));

    return (
        <Card className="flex-1 flex flex-col">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Live Feed</span>
                    <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1"/>
                        Live
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                    {feedItems.map((item) => (
                        <div
                            key={item.id}
                            className={`flex items-start gap-3 p-3 ${
                                item.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                            } rounded-lg`}
                        >
                            {item.status === 'success' ? (
                                <CheckCircle className="w-4 h-4 text-green-600 mt-1"/>
                            ) : (
                                <AlertCircle className="w-4 h-4 text-red-600 mt-1"/>
                            )}
                            <div className="flex-grow">
                                <div className="flex justify-between">
                                    <p className="text-sm font-medium text-gray-900">{item.filename}</p>
                                    <span className="text-xs text-gray-500">{item.timestamp}</span>
                                </div>
                                <p className={`text-sm ${
                                    item.status === 'success' ? 'text-gray-600' : 'text-red-600'
                                }`}>
                                    {item.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default LiveFeed;