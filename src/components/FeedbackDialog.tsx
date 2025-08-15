import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import StarRatings from 'react-star-ratings';
import { useGlobalData } from '@/contexts/AdminDataContext';

type FeedbackDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    comment: string;
    rating: number;
    designName: string;
  }) => void;
};

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ isOpen, onClose, onSubmit }) => {
  const { data } = useGlobalData();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [designName, setDesignName] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    if (name && surname && email && rating > 0) {
      onSubmit({ name: name + ' ' + surname, email, comment, rating, designName });
    }
  };

  const isFormValid = name && surname && email && rating > 0 && designName;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center" style={{color:data.config?.main_color}}>
            ¡DÉJANOS TU OPINIÓN!
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p className="text-center text-gray-700">
            Nos encantó ser parte de esta experiencia, ¿nos cuentas qué te pareció?
          </p>
          <div className="flex gap-2">
            <Input
              id="name"
              placeholder="Nombre*"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{backgroundColor:data.config?.main_color}}
            />
            <Input
              id="surname"
              placeholder="Apellido*"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              style={{backgroundColor:data.config?.main_color}}
            />
          </div>
          <div className="flex gap-2">
            <Input
              id="email"
              placeholder="Correo Electrónico*"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{backgroundColor:data.config?.main_color}}
            />
            <Input
              id="designName"
              placeholder="Nombre del Diseño*"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              style={{backgroundColor:data.config?.main_color}}
            />
          </div>
          <textarea
            id="comment"
            placeholder="Comentario*"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-24 border-input rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            style={{backgroundColor:data.config?.main_color}}
          />
          <div className='flex justify-center'>
            <StarRatings
              rating={rating}
              numberOfStars={5}
              changeRating={setRating}
              starRatedColor="#ffd700"
              starHoverColor="#ffd700"
            />
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={!isFormValid} className="w-full">
          Enviar Opinión
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog; 