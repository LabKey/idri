/*
 * Copyright (c) 2011 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
