// frontend/src/components/generator/ExamplePreviewModal.tsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ExamplePreviewModalProps {
  image: string;
  caption: string;
  onCaptionChange: (caption: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const ExamplePreviewModal: React.FC<ExamplePreviewModalProps> = ({
  image,
  caption,
  onCaptionChange,
  onConfirm,
  onClose,
}) => {
  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Preview Example Pair</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Image Preview */}
          <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={image}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Caption Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Caption</label>
            <Textarea
              value={caption}
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder="Enter caption for this example..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!caption.trim()}>
            Add Example
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamplePreviewModal;