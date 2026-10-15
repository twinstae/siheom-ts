import { Popover } from "@ark-ui/react/popover";
import { Portal } from "@ark-ui/react/portal";

export function ArkPopover() {
  return (
    <div className="flex flex-col items-start gap-4 p-4">
      <button type="button">바깥 버튼</button>
      <Popover.Root>
        <Popover.Trigger>팝오버 열기</Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content className="rounded-lg border bg-popover p-4 shadow-md">
              <Popover.Title>팝오버 제목</Popover.Title>
              <Popover.CloseTrigger>닫기</Popover.CloseTrigger>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </div>
  );
}
