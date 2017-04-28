import test from 'ava'
import { stub } from 'sinon'

import {
  spaceCreate as spaceCreateHandler,
  __RewireAPI__ as spaceCreateRewireAPI
} from '../../../lib/cmds/space_cmds/create'
import {
  emptyContext,
  setContext
} from '../../../lib/context'

const fakeClient = {
  createSpace: stub().returns({
    name: 'Mocked space name',
    sys: {
      id: 'MockedSpaceId'
    }
  })
}
const createClientStub = stub().returns(fakeClient)

test.before(() => {
  spaceCreateRewireAPI.__Rewire__('createClient', createClientStub)
})

test.after.always(() => {
  spaceCreateRewireAPI.__ResetDependency__('createClient')
})

test.afterEach((t) => {
  fakeClient.createSpace.resetHistory()
  createClientStub.resetHistory()
})

test.serial('create space', async (t) => {
  const spaceData = {
    name: 'space name'
  }
  emptyContext()
  setContext({
    cmaToken: 'mockedToken'
  })
  const result = await spaceCreateHandler(spaceData)
  t.truthy(result, 'returned truthy value')
  t.true(createClientStub.calledOnce, 'did create client')
  t.true(fakeClient.createSpace.calledOnce, 'created space')
  t.deepEqual(fakeClient.createSpace.args[0][0], spaceData, 'with correct payload')
  t.is(fakeClient.createSpace.args[0][1], null, 'without organization id')
})

test.serial('create space with passed organization id', async (t) => {
  const spaceData = {
    name: 'space name',
    organization: 'mockedOrganizationId'
  }
  emptyContext()
  setContext({
    cmaToken: 'mockedToken'
  })
  const result = await spaceCreateHandler(spaceData)
  t.truthy(result, 'returned truthy value')
  t.true(createClientStub.calledOnce, 'did create client')
  t.true(fakeClient.createSpace.calledOnce, 'created space')
  t.deepEqual(fakeClient.createSpace.args[0][0], {name: spaceData.name}, 'with correct payload')
  t.is(fakeClient.createSpace.args[0][1], 'mockedOrganizationId', 'with passed organization id')
})

test.serial('create space with organization id from context', async (t) => {
  const spaceData = {
    name: 'space name'
  }
  emptyContext()
  setContext({
    cmaToken: 'mockedToken',
    activeOrganizationId: 'mockedOrganizationIdFromContext'
  })
  const result = await spaceCreateHandler(spaceData)
  t.truthy(result, 'returned truthy value')
  t.true(createClientStub.calledOnce, 'did create client')
  t.true(fakeClient.createSpace.calledOnce, 'created space')
  t.deepEqual(fakeClient.createSpace.args[0][0], spaceData, 'with correct payload')
  t.is(fakeClient.createSpace.args[0][1], 'mockedOrganizationIdFromContext', 'with organization id from context')
})

test.serial('create space - fails when not logged in', async (t) => {
  emptyContext()
  setContext({
    cmaToken: null
  })
  const result = await spaceCreateHandler({})
  t.false(result, 'returned false')

  t.true(createClientStub.notCalled, 'did not create client')
})

test.serial('create space - throws error when sth goes wrong', async (t) => {
  const errorMessage = 'Unable to create space because of reasons'
  fakeClient.createSpace.reset()
  fakeClient.createSpace.throws(new Error(errorMessage))
  emptyContext()
  setContext({
    cmaToken: 'mockedToken'
  })
  await t.throws(spaceCreateHandler({}), errorMessage, 'throws error')
  t.true(fakeClient.createSpace.calledOnce, 'tried to created space')
})