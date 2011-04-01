package org.labkey.idri.util;

import java.util.*;

/**
* Used to iterate a collection that can change during iteration.
*
* Items returned by the dynamic collection iterator are items which:
*   - exist in the collection during the iterator creation
*   - AND were not remove from the collection during the iteration
*
*/
public class DynamicCollectionIterator<T> implements Iterator<T> {

    private final Collection<T> collection;
    private final Iterator<T> copyIterator;
    private T nextItem;

    public DynamicCollectionIterator ( Collection<T> collection ) {
        this .collection = collection;
        Collection<T> collectionCopy = new ArrayList<T> ( collection ) ;
        this .copyIterator = collectionCopy.iterator () ;
        this .nextItem = null ;
    }

    public boolean hasNext () {
        while ( copyIterator.hasNext ()) {
            T item = copyIterator.next () ;
            if ( collection.contains ( item )) {
                this .nextItem = item;
                return true ;
            }
        }
        return false ;
    }

    public T next () {
        if ( nextItem == null )
            if ( !hasNext ())
                return null ;
        try {
            return nextItem;
        }
        finally {
            this .nextItem = null ;
        }
    }

    public void remove () {
        throw new UnsupportedOperationException () ;
    }
}
