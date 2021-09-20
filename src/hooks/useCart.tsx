import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: stock } = await api.get<Stock>(`stock/${productId}`)

      const amountOfItemInCart = cart.find(item => item.id === productId);


      if (stock.amount <= amountOfItemInCart?.amount!) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }
      if (amountOfItemInCart) {
        const newCart = cart.map(item => {
          if (item.id === productId) {
            return { ...item, amount: item.amount + 1 }
          }
          return item

        })
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        setCart(newCart)
        return
      }
      const { data: response } = await api.get<Product>(`products/${productId}`)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify([{ ...response, amount: 1 }, ...cart]))
      setCart([{ ...response, amount: 1 }, ...cart])
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const listWithoutTheItemErro = cart.find(item => item.id === productId);

      if (!listWithoutTheItemErro) {
        throw new Error('Erro na remoção do produto')
      }

      const listWithoutTheItem = cart.filter(item => item.id !== productId);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(listWithoutTheItem))
      setCart(listWithoutTheItem)


    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const itemNotExist = cart.find(item => item.id === productId);

      if (1 > amount) {
        return
      }

      if (!itemNotExist) {
        toast.error('Erro na alteração de quantidade do produto');
        return
      }




      const { data: stock } = await api.get<Stock>(`stock/${productId}`)


      if (stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const updateCart = cart.map(item => {
        if (item.id === productId) {
          return { ...item, amount }
        }
        return item
      })
      setCart(updateCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
