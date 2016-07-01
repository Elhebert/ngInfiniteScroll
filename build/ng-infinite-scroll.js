/* ng-infinite-scroll - v1.2.0 - 2016-07-01 */
var mod;

mod = angular.module('infinite-scroll', []);

mod.value('THROTTLE_MILLISECONDS', null);

mod.directive('infiniteScroll', [
  '$rootScope', '$window', '$interval', '$q', '$swipe', 'THROTTLE_MILLISECONDS', function($rootScope, $window, $interval, $q, $swipe, THROTTLE_MILLISECONDS) {
    return {
      scope: {
        infiniteScroll: '&',
        infiniteScrollContainer: '=',
        infiniteScrollDisabled: '=',
        infiniteScrollDistance: '=',
        infiniteScrollListenForEvent: '@',
        infiniteScrollPromise: '=',
        infiniteScrollUseDocumentBottom: '='
      },
      link: function(scope, elem, attrs) {
        var cancel, changeContainer, checkWhenEnabled, container, handleInfiniteScrollContainer, handleInfiniteScrollDisabled, handleInfiniteScrollDistance, handleInfiniteScrollPromise, handleInfiniteScrollUseDocumentBottom, handler, height, immediateCheck, isVisible, offsetTop, pageYOffset, promise, scrollDirection, scrollDistance, scrollEnabled, throttle, unregisterEventListener, useDocumentBottom, usePromises, waitForPromise, wheelScroll, windowElement;
        checkWhenEnabled = null;
        container = null;
        immediateCheck = true;
        promise = null;
        scrollDirection = attrs.infiniteScrollDirection || 'bottom';
        scrollDistance = null;
        scrollEnabled = null;
        useDocumentBottom = false;
        usePromises = false;
        unregisterEventListener = null;
        waitForPromise = false;
        windowElement = angular.element($window);
        height = function(elem) {
          elem = elem[0] || elem;
          if (isNaN(elem.offsetHeight)) {
            return elem.document.documentElement.clientHeight;
          } else {
            return elem.offsetHeight;
          }
        };
        isVisible = function(elem) {
          return elem[0].offsetWidth && elem[0].offsetHeight;
        };
        offsetTop = function(elem) {
          if (!elem[0].getBoundingClientRect || elem.css('none')) {
            return;
          }
          return elem[0].getBoundingClientRect().top + pageYOffset(elem);
        };
        pageYOffset = function(elem) {
          elem = elem[0] || elem;
          if (isNaN(window.pageYOffset)) {
            return elem.document.documentElement.scrollTop;
          } else {
            return elem.ownerDocument.defaultView.pageYOffset;
          }
        };
        cancel = function() {
          return handler();
        };
        wheelScroll = function(e) {
          if (e.deltaY > 0 || e.deltaY < 0) {
            return handler();
          }
        };
        handler = function() {
          var containerBottom, containerTopOffset, elementBottom, remaining, shouldScroll;
          if (isVisible(elem)) {
            if (container === windowElement) {
              containerBottom = height(container) + pageYOffset(container[0].document.documentElement);
              elementBottom = offsetTop(elem) + height(elem);
              containerTopOffset = container[0].pageYOffset;
            } else {
              containerBottom = height(container);
              containerTopOffset = 0;
              if (offsetTop(container) !== void 0) {
                containerTopOffset = offsetTop(container);
              }
              elementBottom = offsetTop(elem) - containerTopOffset + height(elem);
            }
            if (useDocumentBottom) {
              elementBottom = height((elem[0].ownerDocument || elem[0].document).documentElement);
            }
            if (scrollDirection === 'bottom') {
              remaining = elementBottom - containerBottom;
            } else if (scrollDirection === 'top') {
              remaining = containerTopOffset - offsetTop(elem);
            }
            shouldScroll = remaining <= height(container) * scrollDistance + 1;
          } else {
            shouldScroll = false;
          }
          if (shouldScroll) {
            checkWhenEnabled = true;
            if (scrollEnabled) {
              if (usePromises) {
                if (!waitForPromise) {
                  waitForPromise = true;
                  promise = scope.infiniteScroll();
                  return promise.then(function() {
                    if (!(scope.$$phase || $rootScope.$$phase)) {
                      return scope.$apply();
                    }
                  })["finally"](waitForPromise = false);
                }
              } else {
                if (scope.$$phase || $rootScope.$$phase) {
                  return scope.infiniteScroll();
                } else {
                  return scope.$apply(scope.infiniteScroll);
                }
              }
            }
          } else {
            return checkWhenEnabled = false;
          }
        };
        throttle = function(func, wait) {
          var later, previous, timeout;
          timeout = null;
          previous = 0;
          later = function() {
            var context;
            previous = new Date().getTime();
            $interval.cancel(timeout);
            timeout = null;
            func.call();
            return context = null;
          };
          return function() {
            var now, remaining;
            now = new Date().getTime();
            remaining = wait - (now - previous);
            if (remaining <= 0) {
              clearTimeout(timeout);
              $interval.cancel(timeout);
              timeout = null;
              previous = now;
              return func.call();
            } else {
              if (!timeout) {
                return timeout = $interval(later, remaining, 1);
              }
            }
          };
        };
        if (THROTTLE_MILLISECONDS != null) {
          handler = throttle(handler, THROTTLE_MILLISECONDS);
        }
        scope.$on('$destroy', function() {
          container.unbind('scroll', handler);
          if (unregisterEventListener != null) {
            unregisterEventListener();
            return unregisterEventListener = null;
          }
        });
        handleInfiniteScrollDistance = function(v) {
          return scrollDistance = parseFloat(v) || 0;
        };
        scope.$watch('infiniteScrollDistance', handleInfiniteScrollDistance);
        handleInfiniteScrollDistance(scope.infiniteScrollDistance);
        handleInfiniteScrollDisabled = function(v) {
          scrollEnabled = !v;
          if (scrollEnabled && checkWhenEnabled) {
            checkWhenEnabled = false;
            return handler();
          }
        };
        scope.$watch('infiniteScrollDisabled', handleInfiniteScrollDisabled);
        handleInfiniteScrollDisabled(scope.infiniteScrollDisabled);
        handleInfiniteScrollUseDocumentBottom = function(v) {
          return useDocumentBottom = v;
        };
        scope.$watch('infiniteScrollUseDocumentBottom', handleInfiniteScrollUseDocumentBottom);
        handleInfiniteScrollUseDocumentBottom(scope.infiniteScrollUseDocumentBottom);
        handleInfiniteScrollPromise = function(v) {
          return usePromises = v;
        };
        scope.$watch('infiniteScrollPromise', handleInfiniteScrollPromise);
        handleInfiniteScrollPromise(scope.infiniteScrollPromise);
        changeContainer = function(newContainer) {
          if (container != null) {
            container.unbind('scroll', handler);
            container.unbind('wheel', wheelScroll);
            container.unbind('touchcancel', cancel);
          }
          container = newContainer;
          if (newContainer != null) {
            container.bind('wheel', wheelScroll);
            $swipe.bind(container, {
              cancel: cancel
            }, ['touch']);
            return container.bind('scroll', handler);
          }
        };
        changeContainer(windowElement);
        if (scope.infiniteScrollListenForEvent) {
          unregisterEventListener = $rootScope.$on(scope.infiniteScrollListenForEvent, handler);
        }
        handleInfiniteScrollContainer = function(newContainer) {
          if ((newContainer == null) || newContainer.length === 0) {
            return;
          }
          if (newContainer instanceof HTMLElement) {
            newContainer = angular.element(newContainer);
          } else if (typeof newContainer.append === 'function') {
            newContainer = angular.element(newContainer[newContainer.length - 1]);
          } else if (typeof newContainer === 'string') {
            newContainer = angular.element(document.querySelector(newContainer));
          }
          if (newContainer != null) {
            return changeContainer(newContainer);
          } else {
            throw new Exception("invalid infinite-scroll-container attribute.");
          }
        };
        scope.$watch('infiniteScrollContainer', handleInfiniteScrollContainer);
        handleInfiniteScrollContainer(scope.infiniteScrollContainer || []);
        if (attrs.infiniteScrollParent != null) {
          changeContainer(angular.element(elem.parent()));
        }
        if (attrs.infiniteScrollImmediateCheck != null) {
          immediateCheck = scope.$eval(attrs.infiniteScrollImmediateCheck);
        }
        return $interval((function() {
          if (immediateCheck) {
            return handler();
          }
        }), 0, 1);
      }
    };
  }
]);
