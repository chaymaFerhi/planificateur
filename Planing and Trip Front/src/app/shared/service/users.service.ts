import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of, throwError} from 'rxjs';
import {InventoryPagination} from '../../modules/admin/apps/ecommerce/inventory/inventory.types';
import {Users} from '../model/users.types';
import {ApiService} from './api.service';
import {HttpClient} from '@angular/common/http';
import {catchError, map, switchMap, take, tap} from 'rxjs/operators';
import {environment} from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class UsersService {
    private _pagination: BehaviorSubject<InventoryPagination | null> = new BehaviorSubject(null);
    private _users: BehaviorSubject<Users[] | null> = new BehaviorSubject(null);
     _user: BehaviorSubject<Users | null> = new BehaviorSubject(null);

    constructor(private _apiService: ApiService,
                private _httpClient: HttpClient) {
    }

    /**
     * Getter for products
     */
    get users$(): Observable<Users[]> {
        return this._users.asObservable();
    }

    /**
     * Getter for products
     */
    get user$(): Observable<Users> {
        return this._user.asObservable();
    }

    /**
     * Getter for pagination
     */
    get pagination$(): Observable<InventoryPagination> {
        return this._pagination.asObservable();
    }

    addUser(body): Observable<any> {
        console.log(body);
        return this._apiService.post(`${ApiService.apiUser}/create-user`, body)
            .pipe(map(res => res));

    }

    editUser(body): Observable<Users> {
        return this._apiService.patch(`${ApiService.apiUser}/updateMe`, body).pipe(map(res => res));
    }

    /**
     * Get user by id
     */
    getUserById(id: string): Observable<Users> {
        return this._users.pipe(
            take(1),
            map((users) => {

                // Find the product
                const user = users.find(item => item.id === id) || null;

                // Update the product
                this._user.next(user);

                // Return the product
                return user;
            }),
            switchMap((user) => {

                if (!user) {
                    return throwError('Could not found product with id of ' + id + '!');
                }

                return of(user);
            })
        );
    }

    /**
     * Get products
     *
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getAllUsers(page: number = 0, size: number = 10, sort: string = 'username', order: 'asc' | 'desc' | '' = 'asc', search: string = ''):
        Observable<{ pageable: InventoryPagination; content: Users[] }> {
        return this._httpClient.get<{ pageable: InventoryPagination; content: Users[] }>
        (`${ApiService.apiVersion}${ApiService.apiUser}`
            //, {
            //params: {
            //    page: '' + page,
            //    size: '' + size,
            //    sort,
            //    order,
            //    search
            //}
            //}
        ).pipe(
            tap((response) => {
                this._pagination.next(response.pageable);
                this._users.next(response.content);
            })
        );
    }

    /**
     * Delete the user
     *
     * @param user
     */
    deleteUser(user: Users): Observable<boolean> {
        return this.users$.pipe(
            take(1),
            switchMap(users =>
                this._httpClient.delete(`${ApiService.apiVersion}${ApiService.apiUser}/delete-user/${user.id}`).pipe(
                    map(() => {
                        // Find the index of the deleted product
                        const index = users.findIndex(item => item.id === user.id);
                        // Delete the product
                        users.splice(index, 1);
                        // Update the users
                        this._users.next(users);
                        // Return the deleted status
                        return true;
                    })
                ))
        );
    }

    /**
     * Get the current logged in user data
     */
    get(): Observable<Users> | null {
        const username = localStorage.getItem(environment.activeUser);
        if (!username) {
            console.log(!username);
            return throwError(new Error('Username not found in local storage'));
            // You can customize the error message
        }
        return this._httpClient.get<Users>(`${ApiService.apiVersion}${ApiService.apiUser}/me`).pipe(
            tap((response: any) => {
                console.log(response.data);
                localStorage.setItem(environment.activeUser, JSON.stringify(response.data));
                // Store the access token in the local storage
                this._user.next(response.data);
            }),
            catchError((error: any) =>
                throwError(error) // You can handle the error as needed
            ));
    }
}
